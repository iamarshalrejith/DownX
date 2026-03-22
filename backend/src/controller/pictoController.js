import axios from "axios";

/**
 * POST /api/picto/extract
 *
 * Gemini now returns TWO things per word:
 *   - label:      what to show the student  ("glass")
 *   - wikiSearch: exact Wikipedia-friendly search term ("drinking glass")
 *
 * This fixes ambiguous words like:
 *   "glass"        → "drinking glass"      (not window glass)
 *   "fork"         → "table fork"          (not road fork)
 *   "bat"          → "cricket bat"         (not flying bat)
 *   "iron"         → "clothes iron"        (not metal iron)
 *   "board"        → "cutting board"       (not surfboard)
 *
 * Gemini reads the full sentence for context before assigning wikiSearch.
 */

// ── Fetch Wikipedia image by exact search term ────────────────────────────
const fetchWikiImage = async (searchTerm) => {
  try {
    const res = await axios.get(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(searchTerm)}`,
      {
        timeout: 5000,
        headers: {
          "User-Agent": "DownX-Education-App/1.0 (educational tool for Down syndrome students)",
        },
      }
    );
    const img = res.data?.thumbnail?.source;
    if (img) {
      return {
        imageUrl: img.replace(/\/\d+px-/, "/400px-"),
        wikiTitle: res.data.title || searchTerm,
      };
    }
    return null;
  } catch {
    return null;
  }
};

// Try the Gemini-provided wikiSearch term, then progressively simpler fallbacks
const fetchImageWithFallbacks = async (label, wikiSearch) => {
  const variants = [
    wikiSearch,                                          // e.g. "drinking glass"
    label,                                               // e.g. "glass" (plain)
    label.endsWith("s") ? label.slice(0, -1) : null,    // depluralize
    `${label} (food)`,
    `${label} (tool)`,
    `${label} (object)`,
  ].filter(Boolean);

  // Remove duplicates while preserving order
  const seen = new Set();
  const unique = variants.filter((v) => { if (seen.has(v)) return false; seen.add(v); return true; });

  for (const v of unique) {
    const result = await fetchWikiImage(v);
    if (result?.imageUrl) return { label, wikiSearch, ...result };
  }

  return { label, wikiSearch, imageUrl: null, wikiTitle: label };
};

// ── Main controller ───────────────────────────────────────────────────────
export const extractPictoWords = async (req, res) => {
  try {
    const { stepText } = req.body;

    if (!stepText?.trim()) {
      return res.status(400).json({ success: false, message: "stepText is required" });
    }

    // ── Gemini: extract words WITH context-aware Wikipedia search terms ──
    const prompt = `You are helping a Down syndrome student understand a task step visually.

Read this sentence carefully and extract every concrete noun, object, food, tool, and body part.

For each item, return TWO things:
1. "label"      — the short display word shown to the student (1-2 words)
2. "wikiSearch" — the exact Wikipedia article title that shows the RIGHT meaning in this context

The "wikiSearch" must be specific enough that Wikipedia shows the correct image.
Use context clues from the full sentence to pick the right meaning.

Examples of disambiguation:
- "glass" in a kitchen/juice context → wikiSearch: "drinking glass"
- "glass" in a window context        → wikiSearch: "window glass"
- "fork" at a dining table           → wikiSearch: "table fork"
- "fork" on a road                   → wikiSearch: "road fork"
- "iron" for clothes                 → wikiSearch: "clothes iron"
- "iron" the metal                   → wikiSearch: "iron"
- "board" for cutting                → wikiSearch: "cutting board"
- "bat" in cricket                   → wikiSearch: "cricket bat"
- "bat" the animal                   → wikiSearch: "bat"
- "orange" the fruit                 → wikiSearch: "orange (fruit)"
- "orange" the colour                → wikiSearch: "orange (colour)"

Sentence: "${stepText}"

Return ONLY a valid JSON array of objects. Maximum 7 items. No markdown. No explanation.

Example output for "Gather an orange, a knife, a cutting board, a juicer, and a glass":
[
  {"label": "orange",       "wikiSearch": "orange (fruit)"},
  {"label": "knife",        "wikiSearch": "kitchen knife"},
  {"label": "cutting board","wikiSearch": "cutting board"},
  {"label": "juicer",       "wikiSearch": "juicer"},
  {"label": "glass",        "wikiSearch": "drinking glass"}
]`;

    const geminiRes = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1 },
      },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 15000,
      }
    );

    const raw = geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) throw new Error("Gemini returned empty response");

    console.log("Gemini raw response:", raw);

    // Parse JSON — strip markdown fences if present
    let parsed;
    const cleaned = raw.replace(/```json|```/gi, "").trim();
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const match = cleaned.match(/\[[\s\S]*\]/);
      if (!match) throw new Error("Cannot find JSON array in Gemini response");
      parsed = JSON.parse(match[0]);
    }

    if (!Array.isArray(parsed)) throw new Error("Gemini did not return an array");

    // Normalise — handle both old string format and new {label, wikiSearch} format
    const items = parsed
      .map((item) => {
        if (typeof item === "string") {
          return { label: item.trim().toLowerCase(), wikiSearch: item.trim().toLowerCase() };
        }
        return {
          label:      String(item.label      || item.word || "").trim().toLowerCase(),
          wikiSearch: String(item.wikiSearch || item.label || item.word || "").trim(),
        };
      })
      .filter((i) => i.label.length > 1)
      .slice(0, 7);

    console.log("Items to fetch:", items.map((i) => `${i.label} → "${i.wikiSearch}"`).join(", "));

    // ── Fetch Wikipedia images in parallel ────────────────────────────
    const imageResults = await Promise.all(
      items.map(({ label, wikiSearch }) => fetchImageWithFallbacks(label, wikiSearch))
    );

    const finalItems = imageResults.map(({ label, imageUrl, wikiTitle }) => ({
      word:      label,
      imageUrl:  imageUrl || null,
      wikiTitle: wikiTitle || label,
    }));

    const found = finalItems.filter((i) => i.imageUrl).length;
    console.log(`🖼️  Images found: ${found}/${finalItems.length}`);
    finalItems.forEach((i) => console.log(`  ${i.word}: ${i.imageUrl ? "✓ " + i.wikiTitle : "✗ no image"}`));

    return res.json({ success: true, items: finalItems });

  } catch (error) {
    console.error("extractPictoWords ERROR:", error.message);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", JSON.stringify(error.response.data, null, 2));
    }
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to extract picto words",
      items: [],
    });
  }
};
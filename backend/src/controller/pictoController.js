import axios from "axios";

/**
 * In-memory cache for proxied Wikimedia images: url -> { buffer, contentType }.
 * Capped so a long-running server doesn't grow unbounded; least-recently-
 * added entries are evicted first. Good enough for a school-project scale
 * app — swap for Redis/disk if this needs to survive restarts.
 */
const IMAGE_CACHE_MAX = 300;
const imageCache = new Map();

const cacheSet = (key, value) => {
  if (imageCache.size >= IMAGE_CACHE_MAX) {
    const oldestKey = imageCache.keys().next().value;
    imageCache.delete(oldestKey);
  }
  imageCache.set(key, value);
};

// Only allow proxying actual Wikimedia media URLs — prevents this
// endpoint being abused as an open SSRF proxy for arbitrary URLs.
const isAllowedImageHost = (url) => {
  try {
    const { hostname, protocol } = new URL(url);
    return (
      protocol === "https:" &&
      (hostname === "upload.wikimedia.org" || hostname.endsWith(".wikimedia.org"))
    );
  } catch {
    return false;
  }
};

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
          "User-Agent":
            "DownX-Education-App/1.0 (https://github.com/iamarshalrejith/DownX)",
        },
      }
    );
    const img = res.data?.thumbnail?.source;
    if (img) {
      return {
        // Use Wikipedia's own thumbnail URL as-is. Force-upscaling to a
        // fixed width (e.g. replacing with /400px-) can request a size
        // larger than the source image supports, which Wikimedia's
        // thumbnail renderer rejects with 400 Bad Request.
        imageUrl: img,
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

// ── GET /api/picto/image?url=<upload.wikimedia.org URL> ───────────────────
// Fetches the real image server-side (Node has no browser extensions,
// referrer quirks, or client-side network filters to worry about) and
// streams it back from our own domain, with a small in-memory cache so
// repeat requests for the same word (e.g. "knife" across many tasks)
// don't hit Wikimedia again.
export const proxyPictoImage = async (req, res) => {
  try {
    const { url } = req.query;
    if (!url || !isAllowedImageHost(url)) {
      return res.status(400).json({ success: false, message: "Invalid or disallowed image URL" });
    }

    const cached = imageCache.get(url);
    if (cached) {
      res.set("Content-Type", cached.contentType);
      res.set("Cache-Control", "public, max-age=86400");
      return res.send(cached.buffer);
    }

    const wikiRes = await axios.get(url, {
      responseType: "arraybuffer",
      timeout: 8000,
      headers: {
        "User-Agent":
          "DownX-Education-App/1.0 (https://github.com/iamarshalrejith/DownX) node-axios",
        Accept: "image/*",
      },
    });

    const buffer = Buffer.from(wikiRes.data);
    const contentType = wikiRes.headers["content-type"] || "image/jpeg";
    cacheSet(url, { buffer, contentType });

    res.set("Content-Type", contentType);
    res.set("Cache-Control", "public, max-age=86400");
    return res.send(buffer);
  } catch (error) {
    console.error("proxyPictoImage ERROR:", error.message);
    console.error("  Requested URL:", req.query.url);
    if (error.response) {
      console.error("  Upstream status:", error.response.status);
      console.error("  Upstream headers:", JSON.stringify(error.response.headers, null, 2));
      // Body is often binary/arraybuffer here — try to decode as text for the error page
      try {
        const bodyText = Buffer.isBuffer(error.response.data)
          ? error.response.data.toString("utf-8").slice(0, 500)
          : JSON.stringify(error.response.data).slice(0, 500);
        console.error("  Upstream body:", bodyText);
      } catch {
        console.error("  Upstream body: <could not decode>");
      }
    }
    return res.status(502).json({ success: false, message: "Failed to fetch image" });
  }
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

Read this sentence carefully and extract every concrete noun, object, food, tool, body part, animal, or single letter/number that the sentence is teaching.

For each item, return TWO things:
1. "label"      — the short display word or character shown to the student (1-2 words, or a single letter/number)
2. "wikiSearch" — the exact Wikipedia article title that shows the RIGHT meaning in this context. For a single letter or number, leave wikiSearch the same as label — it will be shown as a big letter/number tile instead of a photo.

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
- "A is for Apple"                   → two items: {"label":"A","wikiSearch":"A"} AND {"label":"apple","wikiSearch":"apple (fruit)"}

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
          label:      String(item.label      || item.word || "").trim(),
          wikiSearch: String(item.wikiSearch || item.label || item.word || "").trim(),
        };
      })
      .filter((i) => i.label.length > 0)
      .map((i) => {
        const isLetterOrNumber = /^[A-Za-z0-9]$/.test(i.label);
        return {
          ...i,
          label: isLetterOrNumber ? i.label.toUpperCase() : i.label.toLowerCase(),
          isLetterOrNumber,
        };
      })
      .slice(0, 7);

    console.log("Items to fetch:", items.map((i) => `${i.label} → "${i.wikiSearch}"`).join(", "));

    // ── Fetch Wikipedia images in parallel (skip for letters/numbers —
    // there's no meaningful photo for a bare "A"; the frontend renders
    // those as a styled letter tile instead) ──────────────────────────
    const imageResults = await Promise.all(
      items.map(({ label, wikiSearch, isLetterOrNumber }) =>
        isLetterOrNumber
          ? Promise.resolve({ label, wikiSearch, imageUrl: null, wikiTitle: label })
          : fetchImageWithFallbacks(label, wikiSearch)
      )
    );

    const finalItems = imageResults.map(({ label, imageUrl, wikiTitle }, idx) => ({
      word: label,
      // Route through our own backend so the browser never talks to
      // upload.wikimedia.org directly (see proxyPictoImage above).
      imageUrl: imageUrl
        ? `${req.protocol}://${req.get("host")}/api/picto/image?url=${encodeURIComponent(imageUrl)}`
        : null,
      wikiTitle: wikiTitle || label,
      isLetterOrNumber: items[idx].isLetterOrNumber,
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

import axios from "axios";

// ── In-memory image cache ────────────────────────────────────────────────

const IMAGE_CACHE_MAX = 300;
const imageCache = new Map();

const cacheSet = (key, value) => {
  if (imageCache.size >= IMAGE_CACHE_MAX) {
    const oldestKey = imageCache.keys().next().value;
    imageCache.delete(oldestKey);
  }

  imageCache.set(key, value);
};

// ── Wikimedia URL validation ─────────────────────────────────────────────

const isAllowedImageHost = (url) => {
  try {
    const { hostname, protocol } = new URL(url);

    return (
      protocol === "https:" &&
      (hostname === "upload.wikimedia.org" ||
        hostname.endsWith(".wikimedia.org"))
    );
  } catch {
    return false;
  }
};

// ── Fetch Wikipedia image ────────────────────────────────────────────────

const fetchWikiImage = async (searchTerm) => {
  try {
    const res = await axios.get(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
        searchTerm
      )}`,
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
        imageUrl: img,
        wikiTitle: res.data.title || searchTerm,
      };
    }

    return null;
  } catch (error) {
    console.warn(
      `[Wikipedia] Image lookup failed for "${searchTerm}":`,
      error.response?.status || error.message
    );

    return null;
  }
};

// ── Try alternative Wikipedia search terms ──────────────────────────────

const fetchImageWithFallbacks = async (label, wikiSearch) => {
  const variants = [
    wikiSearch,
    label,
    label.endsWith("s") ? label.slice(0, -1) : null,
    `${label} (food)`,
    `${label} (tool)`,
    `${label} (object)`,
  ].filter(Boolean);

  const seen = new Set();

  const unique = variants.filter((variant) => {
    if (seen.has(variant)) return false;
    seen.add(variant);
    return true;
  });

  for (const variant of unique) {
    const result = await fetchWikiImage(variant);

    if (result?.imageUrl) {
      return { label, wikiSearch, ...result };
    }
  }

  return {
    label,
    wikiSearch,
    imageUrl: null,
    wikiTitle: label,
  };
};

// ── GET /api/picto/image ─────────────────────────────────────────────────
// Proxies Wikimedia images through our backend.

export const proxyPictoImage = async (req, res) => {
  try {
    const { url } = req.query;

    if (!url || !isAllowedImageHost(url)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or disallowed image URL",
      });
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
    console.error("[Picto Image Proxy] Failed:", error.message);
    console.error("Requested URL:", req.query.url);
    console.error("Upstream status:", error.response?.status || "No response");

    return res.status(502).json({
      success: false,
      message: "Failed to fetch image",
    });
  }
};

// ── POST /api/picto/extract ──────────────────────────────────────────────

export const extractPictoWords = async (req, res) => {
  try {
    const { stepText } = req.body;

    if (!stepText?.trim()) {
      return res.status(400).json({
        success: false,
        message: "stepText is required",
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      console.error("[Picto] GEMINI_API_KEY is missing from environment");

      return res.status(500).json({
        success: false,
        message: "Pictogram service is not configured",
        items: [],
      });
    }

    // ── Gemini prompt ───────────────────────────────────────────────────

    const prompt = `You are helping a Down syndrome student understand a task step visually.

Read this sentence carefully and extract every concrete noun, object, food, tool, body part, animal, or single letter/number that the sentence is teaching.

For each item, return TWO things:

1. "label" — the short display word or character shown to the student (1-2 words, or a single letter/number)
2. "wikiSearch" — the exact Wikipedia article title that shows the RIGHT meaning in this context. For a single letter or number, leave wikiSearch the same as label — it will be shown as a big letter/number tile instead of a photo.

The "wikiSearch" must be specific enough that Wikipedia shows the correct image.
Use context clues from the full sentence to pick the right meaning.

Examples of disambiguation:

- "glass" in a kitchen/juice context → wikiSearch: "drinking glass"
- "glass" in a window context → wikiSearch: "window glass"
- "fork" at a dining table → wikiSearch: "table fork"
- "fork" on a road → wikiSearch: "road fork"
- "iron" for clothes → wikiSearch: "clothes iron"
- "iron" the metal → wikiSearch: "iron"
- "board" for cutting → wikiSearch: "cutting board"
- "bat" in cricket → wikiSearch: "cricket bat"
- "bat" the animal → wikiSearch: "bat"
- "orange" the fruit → wikiSearch: "orange (fruit)"
- "orange" the colour → wikiSearch: "orange (colour)"
- "A is for Apple" → two items: {"label":"A","wikiSearch":"A"} AND {"label":"apple","wikiSearch":"apple (fruit)"}

Sentence: "${stepText}"

Return ONLY a valid JSON array of objects. Maximum 7 items. No markdown. No explanation.

Example output for "Gather an orange, a knife, a cutting board, a juicer, and a glass":

[
  {"label": "orange", "wikiSearch": "orange (fruit)"},
  {"label": "knife", "wikiSearch": "kitchen knife"},
  {"label": "cutting board", "wikiSearch": "cutting board"},
  {"label": "juicer", "wikiSearch": "juicer"},
  {"label": "glass", "wikiSearch": "drinking glass"}
]`;

    // ── Call Gemini ─────────────────────────────────────────────────────

    console.log("[Picto] Sending extraction request to Gemini...");
    console.log("[Picto] Step:", stepText);

    let geminiRes;

    try {
      geminiRes = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1 },
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 20000,
        }
      );
    } catch (geminiError) {
      console.error("========== GEMINI API ERROR ==========");
      console.error("Message:", geminiError.message);
      console.error(
        "HTTP status:",
        geminiError.response?.status || "No HTTP response"
      );
      console.error(
        "Error details:",
        JSON.stringify(geminiError.response?.data || {}, null, 2)
      );
      console.error("=======================================");

      throw geminiError;
    }

    const raw =
      geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!raw) {
      console.error("[Picto] Gemini response:", JSON.stringify(geminiRes.data, null, 2));
      throw new Error("Gemini returned an empty response");
    }

    console.log("[Picto] Gemini raw response:", raw);

    // ── Parse Gemini JSON ───────────────────────────────────────────────

    let parsed;

    const cleaned = raw
      .replace(/```json|```/gi, "")
      .trim();

    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const match = cleaned.match(/\[[\s\S]*\]/);

      if (!match) {
        throw new Error("Cannot find JSON array in Gemini response");
      }

      parsed = JSON.parse(match[0]);
    }

    if (!Array.isArray(parsed)) {
      throw new Error("Gemini did not return an array");
    }

    // ── Normalise extracted items ───────────────────────────────────────

    const items = parsed
      .map((item) => {
        if (typeof item === "string") {
          return {
            label: item.trim().toLowerCase(),
            wikiSearch: item.trim().toLowerCase(),
          };
        }

        return {
          label: String(item.label || item.word || "").trim(),
          wikiSearch: String(
            item.wikiSearch || item.label || item.word || ""
          ).trim(),
        };
      })
      .filter((item) => item.label.length > 0)
      .map((item) => {
        const isLetterOrNumber = /^[A-Za-z0-9]$/.test(item.label);

        return {
          ...item,
          label: isLetterOrNumber
            ? item.label.toUpperCase()
            : item.label.toLowerCase(),
          isLetterOrNumber,
        };
      })
      .slice(0, 7);

    console.log(
      "[Picto] Items to fetch:",
      items
        .map((item) => `${item.label} → "${item.wikiSearch}"`)
        .join(", ")
    );

    // ── Fetch Wikipedia images ──────────────────────────────────────────

    const imageResults = await Promise.all(
      items.map(({ label, wikiSearch, isLetterOrNumber }) =>
        isLetterOrNumber
          ? Promise.resolve({
              label,
              wikiSearch,
              imageUrl: null,
              wikiTitle: label,
            })
          : fetchImageWithFallbacks(label, wikiSearch)
      )
    );

    // ── Build final response ────────────────────────────────────────────

    const finalItems = imageResults.map(
      ({ label, imageUrl, wikiTitle }, index) => ({
        word: label,
        imageUrl: imageUrl
          ? `${req.protocol}://${req.get("host")}/api/picto/image?url=${encodeURIComponent(
              imageUrl
            )}`
          : null,
        wikiTitle: wikiTitle || label,
        isLetterOrNumber: items[index].isLetterOrNumber,
      })
    );

    const found = finalItems.filter((item) => item.imageUrl).length;

    console.log(
      `[Picto] Images found: ${found}/${finalItems.length}`
    );

    finalItems.forEach((item) => {
      console.log(
        `  ${item.word}: ${
          item.imageUrl ? "✓ " + item.wikiTitle : "✗ no image"
        }`
      );
    });

    return res.json({
      success: true,
      items: finalItems,
    });
  } catch (error) {
    console.error("========== PICTOGRAM EXTRACTION ERROR ==========");
    console.error("Message:", error.message);
    console.error(
      "HTTP status:",
      error.response?.status || "No HTTP response"
    );
    console.error(
      "Upstream error details:",
      JSON.stringify(error.response?.data || {}, null, 2)
    );
    console.error("===============================================");

    return res.status(500).json({
      success: false,
      message: "Failed to extract pictogram items. Please try again.",
      items: [],
    });
  }
};

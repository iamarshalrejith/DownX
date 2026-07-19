import express from "express";
import { extractPictoWords, proxyPictoImage } from "../controller/pictoController.js";

const router = express.Router();

// POST /api/picto/extract
// Body: { stepText }
// Returns: { success, items: [{ word, imageUrl, wikiTitle }] }
router.post("/extract", extractPictoWords);

// GET /api/picto/image?url=<encoded upload.wikimedia.org URL>
// Server-side proxy + in-memory cache. The browser only ever talks to
// our own backend, never directly to upload.wikimedia.org — avoids
// browser extensions, antivirus web-shields, or network filters that
// may block that CDN domain specifically, even when Wikipedia's own
// API domain is reachable.
router.get("/image", proxyPictoImage);

export default router;
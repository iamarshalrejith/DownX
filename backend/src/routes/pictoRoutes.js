import express from "express";
import { extractPictoWords } from "../controller/pictoController.js";

const router = express.Router();

// POST /api/picto/extract
// Body: { stepText }
// Returns: { success, items: [{ word, imageUrl, wikiTitle }] }
router.post("/extract", extractPictoWords);

export default router;
import express from "express";
import { chatWithBuddy, simplifyInstruction } from "../controller/aiController.js";
import { protect } from "../middleware/authmiddleware.js";

const router = express.Router();

router.post("/simplify", protect, simplifyInstruction);
router.post("/chat", protect, chatWithBuddy);

export default router;

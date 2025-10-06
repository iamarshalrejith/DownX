import express from "express";
import { simplifyInstruction } from "../controller/aiController.js";
import { protect } from "../middleware/authmiddleware.js";

const router = express.Router();

router.post("/simplify",protect,simplifyInstruction)

export default router;
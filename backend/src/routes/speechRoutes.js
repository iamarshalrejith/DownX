import express from "express";
import { logSpeechAttempt, getStudentSpeechLogs } from "../controller/speechController.js";
import { protect }   from "../middleware/authmiddleware.js";
import { roleGuard } from "../middleware/roleGuard.js";

const router = express.Router();

// Student logs attempt — no JWT, uses enrollmentId
router.post("/log", logSpeechAttempt);

// Teacher/parent views logs
router.get("/student/:enrollmentId", protect, roleGuard("teacher", "parent"), getStudentSpeechLogs);

export default router;
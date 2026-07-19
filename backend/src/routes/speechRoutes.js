import express from "express";
import {
  logSpeechAttempt,
  getStudentSpeechLogs,
  createPracticeItem,
  listPracticeItems,
  deletePracticeItem,
  getStudentPracticeList,
} from "../controller/speechController.js";
import { protect }   from "../middleware/authmiddleware.js";
import { roleGuard } from "../middleware/roleGuard.js";

const router = express.Router();

// Student logs attempt — no JWT, uses enrollmentId
router.post("/log", logSpeechAttempt);

// Teacher/parent views logs
router.get("/student/:enrollmentId", protect, roleGuard("teacher", "parent"), getStudentSpeechLogs);

// ── Standalone Speech Practice (not tied to a task) ────────────────────
// Teacher manages the curated phrase list
router.post("/practice", protect, roleGuard("teacher", "parent"), createPracticeItem);
router.get("/practice", protect, roleGuard("teacher", "parent"), listPracticeItems);
router.delete("/practice/:id", protect, roleGuard("teacher", "parent"), deletePracticeItem);

// Student fetches their combined practice list (teacher phrases + auto task words)
router.get("/practice/student/:enrollmentId", getStudentPracticeList);

export default router;
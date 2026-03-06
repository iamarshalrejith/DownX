import express from "express";
import {
  logGesture,
  getStudentGestures,
  getHelpRequests,
  resolveGesture,
} from "../controller/gestureController.js";
import { protect } from "../middleware/authmiddleware.js";
import { roleGuard } from "../middleware/roleGuard.js";

const router = express.Router();

// POST /api/gestures/log
// Public (student device logs gesture — no auth token on student side)
router.post("/log", logGesture);

// GET /api/gestures/student/:enrollmentId
// Teacher or parent can view a student's gesture history
router.get(
  "/student/:enrollmentId",
  protect,
  roleGuard("teacher", "parent"),
  getStudentGestures
);

// GET /api/gestures/help-requests
// Teacher/parent polls this to get unresolved raised_hand events
router.get(
  "/help-requests",
  protect,
  roleGuard("teacher", "parent"),
  getHelpRequests
);

// PATCH /api/gestures/:gestureId/resolve
// Teacher/parent marks a help request as resolved
router.patch(
  "/:gestureId/resolve",
  protect,
  roleGuard("teacher", "parent"),
  resolveGesture
);

export default router;
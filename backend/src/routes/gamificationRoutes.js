import express from "express";
import { awardPoints, getStudentPoints, getLeaderboard } from "../controller/gamificationController.js";
import { protect }   from "../middleware/authmiddleware.js";
import { roleGuard } from "../middleware/roleGuard.js";

const router = express.Router();

// Student earns points — no JWT, uses enrollmentId
router.post("/award", awardPoints);

// Student fetches their own points/badge
router.get("/student/:enrollmentId", getStudentPoints);

// Teacher views leaderboard
router.get("/leaderboard", protect, roleGuard("teacher", "parent"), getLeaderboard);

export default router;
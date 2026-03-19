import express from "express";
import {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  completeTask,
  uncompleteTask,
} from "../controller/taskController.js";
import {
  verifyObjectForTask,
  getVerificationLogs,
} from "../controller/objectVerificationController.js";
import { protect } from "../middleware/authmiddleware.js";
import { roleGuard } from "../middleware/roleGuard.js";

const router = express.Router();

// Get all tasks
router.get("/", protect, getAllTasks);

// Get task by id
router.get("/:id", protect, getTaskById);

// Create a task
router.post("/", protect, createTask);

// Update a task
router.put("/:id", protect, updateTask);

// Delete a task
router.delete("/:id", protect, deleteTask);

// Mark task as completed
router.put("/complete/:id", protect, completeTask);

// Unmark task
router.put("/uncomplete/:id", protect, uncompleteTask);

// Student submits detected objects for verification
router.post("/:id/verify-object", verifyObjectForTask);

// Teacher/parent views verification history
router.get(
  "/:id/verify-object",
  protect,
  roleGuard("teacher", "parent"),
  getVerificationLogs,
);

export default router;
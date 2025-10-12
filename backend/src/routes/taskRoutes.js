import express from "express";
import {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
} from "../controller/taskController.js";
import { protect } from "../middleware/authmiddleware.js";

const router = express.Router();

// routes or endpoints
//Get all tasks
router.get("/", protect, getAllTasks);

//Get task by id
router.get("/:id", protect, getTaskById);

//Create a task
router.post("/", protect, createTask);

// Updating a task
router.put("/:id", protect, updateTask);

// Deleting a task
router.delete("/:id", protect, deleteTask);

export default router;

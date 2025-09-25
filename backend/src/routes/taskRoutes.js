import express from "express";
import {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
} from "../controller/taskController";

const router = express.Router();

// routes or endpoints
//Get all tasks
router.get("/", getAllTasks);

//Get task by id
router.get("/:id", getTaskById);

//Create a task
router.post("/", createTask);

// Updating a task
router.put("/:id", updateTask);

// Deleting a task
router.delete("/:id", deleteTask);

export default router;

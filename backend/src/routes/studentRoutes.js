import express from "express";
import {
  createStudent,
  linkStudentToUser,
} from "../controller/studentController.js";
import { protect } from "../middleware/authmiddleware.js";

const router = express.Router();

// Teacher create student route
router.post("/create", protect, createStudent);

// Parent/teacher link themselves to Student
router.put("/link", protect, linkStudentToUser);

export default router;

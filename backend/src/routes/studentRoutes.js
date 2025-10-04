import express from "express";
import {
  getMyStudents,
  createStudent,
  linkStudentToUser,
} from "../controller/studentController.js";
import { protect } from "../middleware/authmiddleware.js";

const router = express.Router();

// get students
router.get('/',protect,getMyStudents)

// Teacher create student route
router.post("/create", protect, createStudent);

// Parent/teacher link themselves to Student
router.put("/link", protect, linkStudentToUser);

export default router;

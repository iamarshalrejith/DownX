import express from "express";
import {
  getMyStudents,
  studentLogin,
  createStudent,
  linkStudentToUser,
} from "../controller/studentController.js";
import { protect } from "../middleware/authmiddleware.js";

const router = express.Router();

//login student
router.post('/login',studentLogin)

// get students
router.get('/',protect,getMyStudents)

// Teacher create student 
router.post("/create", protect, createStudent);

// Parent link themselves to Student
router.put("/link", protect, linkStudentToUser);

export default router;

import express from "express";
import {
  getMyStudents,
  studentLogin,
  createStudent,
  linkStudentToUser,
  createFaceEnrollmentSession,
  validateFaceEnrollmentToken,
   completeFaceEnrollment,
   studentFaceLogin,
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

// face enrollment session
router.post(
  "/:studentId/face-enroll-session",
  protect,
  createFaceEnrollmentSession
);

// validate face enrollment token
router.get("/face-enroll/validate", validateFaceEnrollmentToken);

router.post("/face-enroll/complete", completeFaceEnrollment);

router.post("/face-login", studentFaceLogin);

export default router;

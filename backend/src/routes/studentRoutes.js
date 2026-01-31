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
   checkFaceLoginAvailable,
   getStudentLoginOptions,
} from "../controller/studentController.js";

import { protect } from "../middleware/authmiddleware.js";
import { rateLimiter } from "../middleware/rateLimiter.js";
import {roleGuard} from "../middleware/roleGuard.js"
import {loadStudentByEnrollmentId} from "../middleware/loadStudent.js"
import {biometricGuard} from "../middleware/biometricGuard.js"

const router = express.Router();

//login student
router.post('/login', rateLimiter(),studentLogin)

// get students
router.get('/',protect, roleGuard("teacher", "parent"),getMyStudents)

// Teacher create student 
router.post("/create", protect, roleGuard("teacher"), createStudent);

// Parent link themselves to Student
router.put("/link", protect,roleGuard("parent"), linkStudentToUser);

// face enrollment session
router.post(
  "/:studentId/face-enroll-session",
  protect,
  roleGuard("teacher"),
  createFaceEnrollmentSession
);

// validate face enrollment token
router.get("/face-enroll/validate", validateFaceEnrollmentToken);

router.post("/face-enroll/complete", completeFaceEnrollment);

router.post(
  "/face-login",
  rateLimiter(),
  loadStudentByEnrollmentId,
  biometricGuard,
  studentFaceLogin
);

router.post("/face-enabled",rateLimiter(),checkFaceLoginAvailable);

router.post("/login-options",rateLimiter(), getStudentLoginOptions);



export default router;

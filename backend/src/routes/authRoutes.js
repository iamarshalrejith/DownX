import express from "express";
import {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  changePassword,
} from "../controller/authController.js";
import { protect } from "../middleware/authmiddleware.js";

const router = express.Router();

// Public routes
router.post("/register", registerUser);
router.post("/login",    loginUser);

// Protected routes (require valid JWT)
router.get("/me",              protect, getMe);
router.put("/update-profile",  protect, updateProfile);
router.put("/change-password", protect, changePassword);

export default router;
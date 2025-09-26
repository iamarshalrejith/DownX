import express from "express";
import { registerUser,loginUser } from "../controller/authController";

const router = express.Router();

//Register user route
app.post('/register', registerUser);

//Login user route
router.post('/login', loginUser);

// export the router
export default router;
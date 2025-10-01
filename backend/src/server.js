import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import taskRoutes from "./routes/taskRoutes.js"
import authRoutes from "./routes/authRoutes.js";
import { connectDB } from "./config/db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enabling CORS for frontend
app.use(cors({
  origin: "http://localhost:5173", // frontend URL
  credentials: true, // if you need cookies or auth headers
}));

// Middleware to parse JSON
app.use(express.json());

//Routes
app.use("/api/tasks",taskRoutes);
app.use("/api/auth",authRoutes);

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server started on PORT: ${PORT}`);
  });
});



import express from "express";
import dotenv from "dotenv";
import taskRoutes from "./routes/taskRoutes.js"
import authRoutes from "./routes/authRoutes.js";
import { connectDB } from "./config/db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

//Routes
app.use("/api/tasks",taskRoutes);
app.use("/api/auth",authRoutes);

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server started on PORT: ${PORT}`);
  });
});



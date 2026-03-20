import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import gestureRoutes from "./routes/gestureRoutes.js";
import speechRoutes from "./routes/speechRoutes.js";
import gamificationRoutes from "./routes/gamificationRoutes.js";
import { connectDB } from "./config/db.js";
import { errorHandler } from "./middleware/errorHandler.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json({ limit: "10mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/gestures", gestureRoutes);
app.use("/api/speech", speechRoutes);
app.use("/api/gamification", gamificationRoutes);

app.use(errorHandler);

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server started on PORT: ${PORT}`));
});

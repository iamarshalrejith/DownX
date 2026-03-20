import mongoose from "mongoose";

/**
 * PointsLog
 * Every time a student earns points, one document is created.
 * Points are never deleted — total is always Sum(points).
 */
const pointsLogSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    enrollmentId: { type: String, required: true },

    // What triggered the points
    event: {
      type: String,
      enum: [
        "task_complete",      // +10 pts
        "speech_score_good",  // +5 pts (score >= 70)
        "speech_score_great", // +10 pts (score >= 90)
        "streak_bonus",       // +15 pts (3+ tasks in a row)
        "object_verified",    // +5 pts
      ],
      required: true,
    },

    points: { type: Number, required: true },

    // Optional reference
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      default: null,
    },
  },
  { timestamps: true }
);

pointsLogSchema.index({ studentId: 1, createdAt: -1 });

const PointsLog = mongoose.model("PointsLog", pointsLogSchema);
export default PointsLog;
import mongoose from "mongoose";

/**
 * AdaptiveDifficultyLog
 *
 * Records every automatic difficulty-level change so teachers/parents
 * can see why a student's simplification level shifted. Read-only trail,
 * never edited after creation.
 */
const adaptiveDifficultyLogSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },
    previousLevel: {
      type: Number,
      required: true,
    },
    newLevel: {
      type: Number,
      required: true,
    },
    reason: {
      // short machine tag, e.g. "fast_clean_completion", "struggled_slow_help"
      type: String,
      required: true,
    },
    signals: {
      timeTakenMs: Number,
      expectedTimeMs: Number,
      helpRequests: Number,
      verificationFailures: Number,
    },
  },
  { timestamps: true },
);

adaptiveDifficultyLogSchema.index({ studentId: 1, createdAt: -1 });

export default mongoose.model(
  "AdaptiveDifficultyLog",
  adaptiveDifficultyLogSchema,
);
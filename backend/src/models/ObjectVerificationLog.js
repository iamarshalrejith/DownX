import mongoose from "mongoose";

/**
 * ObjectVerificationLog
 *
 * Records every time a student's camera verifies required objects for a task.
 * Used for analytics and audit trail.
 */
const objectVerificationLogSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    enrollmentId: {
      type: String,
      required: true,
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },
    // Which objects were required by the task
    requiredObjects: {
      type: [String],
      default: [],
    },
    // Which objects were actually detected and confirmed
    detectedObjects: {
      type: [String],
      default: [],
    },
    // Whether all required objects were found
    verified: {
      type: Boolean,
      default: false,
    },
    // Confidence scores for each detected object
    confidenceScores: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  { timestamps: true }
);

objectVerificationLogSchema.index({ studentId: 1, taskId: 1 });
objectVerificationLogSchema.index({ taskId: 1, verified: 1 });

export default mongoose.model("ObjectVerificationLog", objectVerificationLogSchema);
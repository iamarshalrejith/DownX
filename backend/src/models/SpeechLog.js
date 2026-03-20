import mongoose from "mongoose";

const speechLogSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    enrollmentId: { type: String, required: true },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },
    stepIndex:   { type: Number, required: true },
    stepText:    { type: String, default: "" },
    spokenText:  { type: String, default: "" },
    score:       { type: Number, required: true }, // 0-100
    matchedWords:{ type: [String], default: [] },
    missedWords: { type: [String], default: [] },
  },
  { timestamps: true }
);

speechLogSchema.index({ studentId: 1, taskId: 1, createdAt: -1 });

const SpeechLog = mongoose.model("SpeechLog", speechLogSchema);
export default SpeechLog;
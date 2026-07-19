import mongoose from "mongoose";

/**
 * SpeechPracticeItem
 *
 * A phrase a teacher wants a student (or all students) to practice
 * saying, independent of any task. Lives in its own standalone
 * "Speech Practice" section rather than being tied to a task step.
 */
const speechPracticeItemSchema = new mongoose.Schema(
  {
    phrase: {
      type: String,
      required: true,
      trim: true,
    },
    // Exactly one of these should be meaningful, same pattern as Task's
    // assignedTo/assignedToAll:
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      default: null,
    },
    assignedToAll: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

speechPracticeItemSchema.index({ assignedTo: 1 });

export default mongoose.model("SpeechPracticeItem", speechPracticeItemSchema);
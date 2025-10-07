import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    //The original (complex) description entered by the user
    description: {
      type: String,
    },

    // manual steps (if you ever add custom step creation) -> optional
    steps: {
      type: [String],
      default:[]
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // reference to user model
      required: true,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },

    // Stores the original instruction text sent to Gemini (optional)
    originalInstructions: {
      type: String,
      default: "",
    },
    // Stores the array of simplified steps returned by Gemini
    simplifiedSteps: {
      type: [String],
      default: [],
    }
  },
  { timestamps: true }
);

const Task = mongoose.model("Task", taskSchema);

export default Task;

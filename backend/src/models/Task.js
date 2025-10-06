import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
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
    originalInstructions: {
      type: String,
      default: "",
    },
    simplifiedSteps: {
      type: [String],
      default: [],
    }
  },
  { timestamps: true }
);

const Task = mongoose.model("Task", taskSchema);

export default Task;

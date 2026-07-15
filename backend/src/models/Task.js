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
      default: [],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // reference to user model
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      default: null,
    },
    assignedToAll: {
      type: Boolean,
      default: false,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    completedBy: [
      {
        studentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Student",
          required: true,
        },
        completedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Stores the original instruction text sent to Gemini (optional)
    originalInstructions: {
      type: String,
      default: "",
    },
    // Stores the array of simplified steps returned by Gemini
    simplifiedSteps: {
      type: [String],
      default: [],
    },
    // Adaptive Learning (Days 70-75): tracks when a student started this
    // task so completeTask can measure time-to-completion. One entry per
    // student currently working on it; removed once they complete/uncomplete.
    inProgress: [
      {
        studentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Student",
          required: true,
        },
        startedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    objectVerification: {
      enabled: {
        type: Boolean,
        default: false,
      },
      requiredObjects: {
        type: [String],
        default: [],
      },
      verificationInstruction: {
        type: String,
        default: "",
      },
    },
  },
  { timestamps: true },
);

const Task = mongoose.model("Task", taskSchema);

export default Task;
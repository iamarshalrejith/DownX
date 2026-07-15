import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    caretakers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // references teachers and parents
      },
    ],
    tasksAssigned: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task", // references tasks in their learning path
      },
    ],
    enrollmentId: {
      type: String,
      required: true,
      unique: true,
    },
    visualPin: {
      type: [String],
      default: [],
    },
    faceEmbedding: {
      type: [Number],
      default: null,
      select: false, // hidden by default for security
    },
    faceAuthEnabled: {
      type: Boolean,
      default: false,
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    loginLockUntil: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Adaptive Learning (Days 70-75): 1 = most simplified, 5 = least simplified.
    // Adjusted automatically after each task completion based on
    // time-to-completion, help-request gestures, and verification failures.
    difficultyLevel: {
      type: Number,
      default: 3,
      min: 1,
      max: 5,
    },
  },
  {
    timestamps: true,
  },
);

const Student = mongoose.model("Student", studentSchema);

export default Student;
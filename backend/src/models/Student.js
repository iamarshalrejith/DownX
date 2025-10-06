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
    visualPin : {
      type: [String],
      default: [],
    }
  },
  {
    timestamps: true,
  }
);

const Student = mongoose.model("Student", studentSchema);

export default Student;

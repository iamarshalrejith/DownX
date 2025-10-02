import Student from "../models/Student.js";
import User from "../models/User.js";

// Create a new student -> only teachers allowed
export const createStudent = async (req, res) => {
  try {
    if (req.user.role !== "teacher") {
      return res
        .status(403)
        .json({ message: "Only teachers can create students" });
    }

    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Student name is required" });
    }

    // create student & auto link to teacher
    const student = new Student({
      name,
      caretakers: [req.user._id], // teacher linked
    });

    await student.save();

    return res.status(201).json(student);
  } catch (error) {
    console.error("Error creating student: ", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// link an existing student to parent or teacher
export const linkStudentToUser = async (req, res) => {
  try {
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({ message: "Student ID is required" });
    }

    // Find Student
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Add user to caretaker if not already present
    if (!student.caretakers.includes(req.user._id)) {
      student.caretakers.push(req.user._id);
      await student.save();
    }

    // update User with linked student
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { studentId },
      { new: true }
    ).select("-password");

    return res.status(200).json({
      message: "Student linked successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error Linking student: ", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

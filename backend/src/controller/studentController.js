import Student from "../models/Student.js";
import User from "../models/User.js";
import Counter from "../models/Counter.js";

// Helper to generate enrollment ID
export const generateEnrollmentId = async () => {
  const year = new Date().getFullYear();
  const counterId = `DX-${year}`;

  // Atomically increment counter
  const counter = await Counter.findOneAndUpdate(
    { _id: counterId },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  return `DX-${year}${counter.seq.toString().padStart(4, "0")}`;
};

// Get all students linked to the logged-in user
export const getMyStudents = async (req, res) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ message: "Unauthorized: user not logged in" });
    }

    const userId = req.user._id;
    const students = await Student.find({ caretakers: { $in: [userId] } });
    return res.status(200).json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Create a new student -> only teachers allowed
export const createStudent = async (req, res) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ message: "Unauthorized: user not logged in" });
    }

    if (req.user.role !== "teacher") {
      return res
        .status(403)
        .json({ message: "Only teachers can create students" });
    }

    const { name } = req.body;
    if (!name || typeof name !== "string" || name.trim() === "") {
      return res
        .status(400)
        .json({
          message: "Student name is required and must be a non-empty string",
        });
    }

    // Generate enrollmentId in the controller
    const enrollmentId = await generateEnrollmentId();

    const student = new Student({
      name: name.trim(),
      caretakers: [req.user._id],
      enrollmentId,
    });

    await student.save();
    return res.status(201).json(student);
  } catch (error) {
    console.error("Error creating student:", {
      message: error.message,
      stack: error.stack,
      body: req.body,
      user: req.user ? req.user._id : null,
    });

    if (
      error.code === 11000 &&
      error.keyPattern &&
      error.keyPattern.enrollmentId
    ) {
      return res
        .status(409)
        .json({ message: "Enrollment ID conflict. Please try again." });
    }

    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Link an existing student to a parent or teacher
export const linkStudentToUser = async (req, res) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ message: "Unauthorized: user not logged in" });
    }

    const { enrollmentId } = req.body;
    if (!enrollmentId) {
      return res.status(400).json({ message: "Enrollment Id is required" });
    }

    const student = await Student.findOne({ enrollmentId });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Add user to caretakers if not already present
    if (!student.caretakers.includes(req.user._id)) {
      student.caretakers.push(req.user._id);
      await student.save();
    }

    // Update User: support multiple students
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { studentIds: student._id } }, // store multiple students
      { new: true }
    ).select("-password");

    return res.status(200).json({
      message: "Student linked successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error linking student:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

import Student from "../models/Student.js";
import User from "../models/User.js";
import Counter from "../models/Counter.js";
import jwt from "jsonwebtoken"
import FaceEnrollmentSession from "../models/FaceEnrollmentSession.js";
import generateEnrollmentToken from "../utils/generateEnrollmentToken.js";

// Helper to generate enrollment ID
export const generateEnrollmentId = async () => {
  const year = new Date().getFullYear();
  const counterId = `DX-${year}`;

  // increment counter
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

    const { name,visualPin } = req.body;
    if (!name || typeof name !== "string" || name.trim() === "") {
      return res.status(400).json({
        message: "Student name is required and must be a non-empty string",
      });
    }

    // Generate enrollmentId in the controller
    const enrollmentId = await generateEnrollmentId();

    const student = new Student({
      name: name.trim(),
      caretakers: [req.user._id],
      enrollmentId,
      visualPin: Array.isArray(visualPin) ? visualPin : [],
    });

    await student.save();
    await User.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { studentIds: student._id } }, // prevent duplicates
      { new: true }
    );
    return res.status(201).json(student);
  } catch (error) {
    console.error("Error creating student:", error.message);

    if (error.code === 11000 && error.keyPattern?.enrollmentId) {
      return res
        .status(409)
        .json({ message: "Enrollment ID conflict. Please try again." });
    }

    return res.status(500).json({ message: "Failed to create student" });
  }
};

// Link an existing student to a parent, also update visual PIN
export const linkStudentToUser = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const { enrollmentId, visualPin } = req.body;
    if (!enrollmentId) return res.status(400).json({ message: "Enrollment Id is required" });

    const student = await Student.findOne({ enrollmentId });
    if (!student) return res.status(404).json({ message: "Student not found" });

    if (!student.caretakers.includes(req.user._id)) student.caretakers.push(req.user._id);

    if (Array.isArray(visualPin)) student.visualPin = visualPin; // update visual PIN if provided

    await student.save();

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { studentIds: student._id } },
      { new: true }
    ).select("-password");

    return res.status(200).json({ message: "Student linked successfully", user: updatedUser,student });
  } catch (error) {
    console.error("Error linking student:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Student login with visual PIN and JWT
export const studentLogin = async (req, res) => {
  try {
    const { enrollmentId, visualPin } = req.body;

    if (!enrollmentId || !Array.isArray(visualPin) || visualPin.length === 0) {
      return res.status(400).json({ message: "Enrollment ID and Visual PIN are required" });
    }

    const student = await Student.findOne({ enrollmentId });
    if (!student) return res.status(404).json({ message: "Student not found" });

    const isPinCorrect =
      Array.isArray(student.visualPin) &&
      student.visualPin.length === visualPin.length &&
      student.visualPin.every((val, i) => val === visualPin[i]);

    if (!isPinCorrect) return res.status(401).json({ message: "Incorrect Visual PIN" });

    const token = jwt.sign(
      { id: student._id, enrollmentId: student.enrollmentId },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    return res.status(200).json({ student, token });
  } catch (error) {
    console.error("Student login error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Create face enrollment session (Teacher / Parent)
export const createFaceEnrollmentSession = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!["teacher", "parent"].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const { studentId } = req.params;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Ensure teacher/parent is linked to this student
    if (!student.caretakers.includes(req.user._id)) {
      return res.status(403).json({ message: "Not linked to this student" });
    }

    const token = generateEnrollmentToken();

    const session = await FaceEnrollmentSession.create({
      studentId: student._id,
      token,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 mins
    });

    return res.status(201).json({
      enrollmentToken: session.token,
      expiresAt: session.expiresAt,
    });
  } catch (error) {
    console.error("Create face enrollment session error:", error);
    return res.status(500).json({ message: "Failed to create enrollment session" });
  }
};

// Validate face enrollment token
export const validateFaceEnrollmentToken = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }

    const session = await FaceEnrollmentSession.findOne({ token });

    if (!session) {
      return res.status(404).json({ message: "Invalid enrollment token" });
    }

    if (session.used) {
      return res.status(410).json({ message: "Token already used" });
    }

    if (session.expiresAt < new Date()) {
      return res.status(410).json({ message: "Token expired" });
    }

    return res.status(200).json({
      studentId: session.studentId,
      message: "Token valid",
    });
  } catch (error) {
    console.error("Validate enrollment token error:", error);
    return res.status(500).json({ message: "Token validation failed" });
  }
};

// Complete face enrollment
export const completeFaceEnrollment = async (req, res) => {
  try {
    const { token, faceEmbedding } = req.body;

    if (!token || !Array.isArray(faceEmbedding)) {
      return res.status(400).json({ message: "Invalid payload" });
    }

    const session = await FaceEnrollmentSession.findOne({ token });
    if (!session) {
      return res.status(404).json({ message: "Invalid token" });
    }

    if (session.used || session.expiresAt < new Date()) {
      return res.status(410).json({ message: "Token expired or used" });
    }

    const student = await Student.findById(session.studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    student.faceEmbedding = faceEmbedding;
    await student.save();

    session.used = true;
    await session.save();

    return res.status(200).json({ message: "Face enrollment completed" });
  } catch (error) {
    console.error("Complete face enrollment error:", error);
    return res.status(500).json({ message: "Enrollment failed" });
  }
};

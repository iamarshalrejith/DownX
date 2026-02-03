import Student from "../models/Student.js";
import User from "../models/User.js";
import Counter from "../models/Counter.js";
import jwt from "jsonwebtoken";
import FaceEnrollmentSession from "../models/FaceEnrollmentSession.js";
import generateEnrollmentToken from "../utils/generateEnrollmentToken.js";
import cosineSimilarity from "../utils/vectorSimilarity.js";
import { logAudit } from "../utils/auditLogger.js";

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

    const { name, visualPin } = req.body;
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
    if (!enrollmentId)
      return res.status(400).json({ message: "Enrollment Id is required" });

    const student = await Student.findOne({ enrollmentId });
    if (!student) return res.status(404).json({ message: "Student not found" });

    if (!student.caretakers.includes(req.user._id))
      student.caretakers.push(req.user._id);

    if (Array.isArray(visualPin)) student.visualPin = visualPin; // update visual PIN if provided

    await student.save();

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { studentIds: student._id } },
      { new: true }
    ).select("-password");

    return res.status(200).json({
      message: "Student linked successfully",
      user: updatedUser,
      student,
    });
  } catch (error) {
    console.error("Error linking student:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Student login with visual PIN and JWT
export const studentLogin = async (req, res) => {
  try {
    const { enrollmentId, visualPin } = req.body;

    if (!enrollmentId || !Array.isArray(visualPin) || visualPin.length === 0) {
      return res
        .status(400)
        .json({ message: "Enrollment ID and Visual PIN are required" });
    }

    const student = await Student.findOne({ enrollmentId });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // BLOCK INACTIVE STUDENTS
    if (!student.isActive) {
      return res.status(403).json({
        message:
          "This account is currently inactive. Please contact a teacher.",
      });
    }

    const isPinCorrect =
      Array.isArray(student.visualPin) &&
      student.visualPin.length === visualPin.length &&
      student.visualPin.every((val, i) => val === visualPin[i]);

    if (!isPinCorrect) {
      student.loginAttempts += 1;

      let lockTriggered = false;

      if (student.loginAttempts >= 5) {
        student.loginLockUntil = new Date(Date.now() + 5 * 60 * 1000);
        student.loginAttempts = 0;
        lockTriggered = true;
      }

      await student.save();

      if (lockTriggered) {
        await logAudit({
          action: "LOGIN_LOCK_TRIGGERED",
          req,
          studentId: student._id,
        });
      }

      return res.status(401).json({
        message: "Incorrect Visual PIN",
      });
    }

    // SUCCESS - reset lock state
    student.loginAttempts = 0;
    student.loginLockUntil = null;
    await student.save();

    const token = jwt.sign(
      { id: student._id, enrollmentId: student.enrollmentId },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    return res.status(200).json({ student, token });
  } catch (error) {
    console.error("Student login error:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
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
    return res
      .status(500)
      .json({ message: "Failed to create enrollment session" });
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
    student.faceAuthEnabled = true;
    await student.save();

    session.used = true;
    await session.save();
    await logAudit({
      action: "FACE_ENROLLMENT_COMPLETE",
      req,
      studentId: student._id,
    });

    return res.status(200).json({ message: "Face enrollment completed" });
  } catch (error) {
    console.error("Complete face enrollment error:", error);
    return res.status(500).json({ message: "Enrollment failed" });
  }
};

// Student face login
export const studentFaceLogin = async (req, res, next) => {
  try {
    const student = req.student;
    const { faceEmbedding } = req.body;

    if (!Array.isArray(faceEmbedding)) {
      return res.status(400).json({
        message: "Invalid face embedding",
      });
    }

    if (!Array.isArray(student.faceEmbedding)) {
      return res.status(500).json({
        message: "Stored face data missing",
      });
    }

    const similarity = cosineSimilarity(student.faceEmbedding, faceEmbedding);

    const THRESHOLD = 0.72; // keep your tested value

    if (similarity < THRESHOLD) {
      student.loginAttempts += 1;

      let lockTriggered = false;

      if (student.loginAttempts >= 5) {
        student.loginLockUntil = new Date(Date.now() + 5 * 60 * 1000);
        student.loginAttempts = 0;
        lockTriggered = true;
      }

      await student.save();

      if (lockTriggered) {
        await logAudit({
          action: "LOGIN_LOCK_TRIGGERED",
          req,
          studentId: student._id,
        });
      }

      return res.status(401).json({
        message: "Face verification failed",
      });
    }

    // SUCCESS - reset lock state
    student.loginAttempts = 0;
    student.loginLockUntil = null;
    await student.save();

    const token = jwt.sign(
      {
        id: student._id,
        enrollmentId: student.enrollmentId,
        role: "student",
      },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    return res.status(200).json({
      message: "Face login successful",
      token,
      student: {
        id: student._id,
        name: student.name,
        enrollmentId: student.enrollmentId,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Check Face Login Available
export const checkFaceLoginAvailable = async (req, res) => {
  const { enrollmentId } = req.body;

  const student = await Student.findOne({ enrollmentId }).select(
    "+faceEmbedding"
  );

  if (!student || !student.faceEmbedding) {
    return res.json({ faceEnabled: false });
  }

  return res.json({ faceEnabled: true });
};

// Giving Login Options for student
export const getStudentLoginOptions = async (req, res) => {
  const { enrollmentId } = req.body;

  const student = await Student.findOne({ enrollmentId }).select(
    "+faceEmbedding"
  );

  if (!student) {
    return res.status(404).json({ message: "Student not found" });
  }

  return res.json({
    faceEnabled: !!student.faceEmbedding?.length,
  });
};

export const resetStudentPin = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { visualPin } = req.body;

    if (!Array.isArray(visualPin) || visualPin.length === 0) {
      return res.status(400).json({
        message: "Valid visual PIN is required",
      });
    }

    const student = await Student.findById(studentId);

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    // Ensure adult is linked to student
    if (!student.caretakers.includes(req.user._id)) {
      return res.status(403).json({
        message: "Not authorized to reset this student's PIN",
      });
    }

    student.visualPin = visualPin;
    await student.save();
    await logAudit({
      action: "PIN_RESET",
      req,
      studentId: student._id,
    });

    return res.status(200).json({
      message: "Visual PIN reset successfully",
    });
  } catch (error) {
    console.error("Reset PIN error:", error);
    return res.status(500).json({
      message: "Failed to reset PIN",
    });
  }
};

export const toggleFaceAuth = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { enabled } = req.body;

    if (typeof enabled !== "boolean") {
      return res.status(400).json({
        message: "enabled must be a boolean",
      });
    }

    const student = await Student.findById(studentId);

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    // Ensure adult is linked to student
    if (!student.caretakers.includes(req.user._id)) {
      return res.status(403).json({
        message: "Not authorized to modify this student",
      });
    }

    student.faceAuthEnabled = enabled;
    await student.save();
    await logAudit({
      action: "FACE_AUTH_TOGGLE",
      req,
      studentId: student._id,
      meta: { enabled },
    });

    return res.status(200).json({
      message: `Face authentication ${enabled ? "enabled" : "disabled"}`,
      faceAuthEnabled: student.faceAuthEnabled,
    });
  } catch (error) {
    console.error("Toggle face auth error:", error);
    return res.status(500).json({
      message: "Failed to update face authentication",
    });
  }
};

export const toggleStudentActiveStatus = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { active } = req.body;

    if (typeof active !== "boolean") {
      return res.status(400).json({
        message: "active must be a boolean",
      });
    }

    const student = await Student.findById(studentId);

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    // Ensure adult is linked to student
    if (!student.caretakers.includes(req.user._id)) {
      return res.status(403).json({
        message: "Not authorized to modify this student",
      });
    }

    student.isActive = active;
    await student.save();
    await logAudit({
      action: active ? "STUDENT_ACTIVATED" : "STUDENT_DEACTIVATED",
      req,
      studentId: student._id,
    });

    return res.status(200).json({
      message: `Student ${active ? "activated" : "deactivated"} successfully`,
      isActive: student.isActive,
    });
  } catch (error) {
    console.error("Toggle student active status error:", error);
    return res.status(500).json({
      message: "Failed to update student status",
    });
  }
};

import GestureEvent from "../models/GestureEvent.js";
import Student from "../models/Student.js";
import { notifyTeacher } from "../utils/notificationService.js";

const VALID_GESTURES = ["raised_hand", "thumbs_up", "thumbs_down", "peace_sign"];

// ─── POST /api/gestures/log ───────────────────────────────────────────────────
export const logGesture = async (req, res) => {
  try {
    const { enrollmentId, gestureType, confidence, taskId, context } = req.body;

    // ── Validate ──────────────────────────────────────────────────────────────
    if (!enrollmentId || !gestureType || confidence === undefined) {
      return res.status(400).json({
        success: false,
        message: "enrollmentId, gestureType, and confidence are required",
      });
    }

    if (!VALID_GESTURES.includes(gestureType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid gestureType. Allowed: ${VALID_GESTURES.join(", ")}`,
      });
    }

    if (typeof confidence !== "number" || confidence < 0 || confidence > 1) {
      return res.status(400).json({
        success: false,
        message: "confidence must be a number between 0 and 1",
      });
    }

    // ── Find student ──────────────────────────────────────────────────────────
    const student = await Student.findOne({ enrollmentId });
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    // ── Deduplicate: skip if same gesture logged in last 30 seconds ───────────
    const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
    const recentDuplicate = await GestureEvent.findOne({
      studentId: student._id,
      gestureType,
      resolved: false,
      createdAt: { $gte: thirtySecondsAgo },
    });

    if (recentDuplicate) {
      return res.status(200).json({
        success: true,
        message: "Gesture already logged recently — skipped duplicate",
        gestureEvent: { _id: recentDuplicate._id, gestureType, confidence },
      });
    }

    // ── Create event ──────────────────────────────────────────────────────────
    const gestureEvent = await GestureEvent.create({
      studentId: student._id,
      enrollmentId,
      gestureType,
      confidence,
      taskId: taskId || null,
      context: context || {},
      teacherNotified: gestureType === "raised_hand",
    });

    // ── Notify teacher for help requests ─────────────────────────────────────
    if (gestureType === "raised_hand") {
      await notifyTeacher(student, gestureEvent);
    }

    console.log(
      `Gesture logged: ${gestureType} by ${student.name} (${(confidence * 100).toFixed(0)}%)`
    );

    return res.status(201).json({
      success: true,
      message: "Gesture logged successfully",
      gestureEvent: {
        _id: gestureEvent._id,
        gestureType: gestureEvent.gestureType,
        confidence: gestureEvent.confidence,
        createdAt: gestureEvent.createdAt,
      },
    });
  } catch (error) {
    console.error("logGesture error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error logging gesture",
      ...(process.env.NODE_ENV === "development" && { error: error.message }),
    });
  }
};

// ─── GET /api/gestures/student/:enrollmentId ─────────────────────────────────
export const getStudentGestures = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);

    const student = await Student.findOne({ enrollmentId });
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const gestures = await GestureEvent.find({ studentId: student._id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("taskId", "title")
      .lean();

    return res.json({ success: true, count: gestures.length, gestures });
  } catch (error) {
    console.error("getStudentGestures error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── GET /api/gestures/help-requests ─────────────────────────────────────────
export const getHelpRequests = async (req, res) => {
  try {
    const userId = req.user._id;

    // All students linked to this teacher/parent
    const students = await Student.find({ caretakers: userId }).select("_id");

    if (!students.length) {
      return res.json({ success: true, helpRequests: [], count: 0 });
    }

    const studentIds = students.map((s) => s._id);

    const helpRequests = await GestureEvent.find({
      studentId: { $in: studentIds },
      gestureType: "raised_hand",
      resolved: false,
    })
      .sort({ createdAt: -1 })
      .populate("studentId", "name enrollmentId")
      .populate("taskId", "title")
      .lean();

    return res.json({
      success: true,
      count: helpRequests.length,
      helpRequests,
    });
  } catch (error) {
    console.error("getHelpRequests error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── PATCH /api/gestures/:gestureId/resolve ───────────────────────────────────
export const resolveGesture = async (req, res) => {
  try {
    const { gestureId } = req.params;
    const { responseNote } = req.body;

    // Validate ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(gestureId)) {
      return res.status(400).json({ success: false, message: "Invalid gesture ID" });
    }

    const gesture = await GestureEvent.findByIdAndUpdate(
      gestureId,
      {
        resolved: true,
        "teacherResponse.respondedAt": new Date(),
        "teacherResponse.responseNote":
          responseNote || "Teacher acknowledged and helped",
      },
      { new: true }
    )
      .populate("studentId", "name enrollmentId")
      .populate("taskId", "title");

    if (!gesture) {
      return res.status(404).json({ success: false, message: "Gesture event not found" });
    }

    console.log(` Resolved: ${gesture._id} for ${gesture.studentId?.name}`);

    return res.json({
      success: true,
      message: "Help request resolved",
      gesture,
    });
  } catch (error) {
    console.error("resolveGesture error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
import ObjectVerificationLog from "../models/ObjectVerificationLog.js";
import Student from "../models/Student.js";
import Task from "../models/Task.js";

/**
 * POST /api/tasks/:id/verify-object
 *
 * Called by the student's frontend when the ObjectDetector confirms
 * required objects are visible. Logs the event and returns verification status.
 *
 * Body: { enrollmentId, detectedObjects: string[], confidenceScores: {label: score} }
 */

export const verifyObjectForTask = async (req, res) => {
  try {
    const { id: taskId } = req.params;
    const { enrollmentId, detectedObjects, confidenceScores } = req.body;

    // Validate
    if (!enrollmentId || !Array.isArray(detectedObjects)) {
      return res.status(400).json({
        success: false,
        message: "enrollmentId and detectedObjects array are required",
      });
    }

    // Find student
    const student = await Student.findOne({ enrollmentId });
    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }

    //  Find task
    const task = await Task.findById(taskId);
    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }

    // Check against task's required objects
    const required = task.objectVerification?.requiredObjects || [];
    const detectedLower = detectedObjects.map((d) => d.toLowerCase());
    const verified =
      required.length > 0 &&
      required.every((r) => detectedLower.includes(r.toLowerCase()));

    // Deduplicate: skip if already verified in last 60 second
    const sixtySecondsAgo = new Date(Date.now() - 60 * 1000);
    const recent = await ObjectVerificationLog.findOne({
      studentId: student._id,
      taskId,
      verified: true,
      createdAt: { $gte: sixtySecondsAgo },
    });

    if (recent) {
      return res.status(200).json({
        success: true,
        message: "Already verified recently",
        verified: true,
        alreadyLogged: true,
      });
    }

    // Log verification event
    const log = await ObjectVerificationLog.create({
      studentId: student._id,
      enrollmentId,
      taskId,
      requiredObjects: required,
      detectedObjects: detectedObjects,
      verified,
      confidenceScores: confidenceScores || {},
    });

    console.log(
      `Object verify: task="${task.title}" student="${student.name}" verified=${verified}`,
    );

    return res.status(201).json({
      success: true,
      verified,
      requiredObjects: required,
      detectedObjects,
      missing: required.filter((r) => !detectedLower.includes(r.toLowerCase())),
      logId: log._id,
    });
  } catch (error) {
    console.error("verifyObjectForTask error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during object verification",
      ...(process.env.NODE_ENV === "development" && { error: error.message }),
    });
  }
};

/**
 * GET /api/tasks/:id/verify-object
 *
 * Teacher/parent views the verification history for a task.
 */
export const getVerificationLogs = async (req, res) => {
  try {
    const { id: taskId } = req.params;

    const logs = await ObjectVerificationLog.find({ taskId })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("studentId", "name enrollmentId")
      .lean();

    return res.json({ success: true, count: logs.length, logs });
  } catch (error) {
    console.error("getVerificationLogs error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

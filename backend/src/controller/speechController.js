import SpeechLog  from "../models/SpeechLog.js";
import PointsLog  from "../models/PointsLog.js";
import Student    from "../models/Student.js";
import Task       from "../models/Task.js";

/**
 * POST /api/speech/log
 * Body: { enrollmentId, taskId, stepIndex, stepText, spokenText, score, matchedWords, missedWords }
 */
export const logSpeechAttempt = async (req, res) => {
  try {
    const {
      enrollmentId, taskId, stepIndex,
      stepText, spokenText, score,
      matchedWords, missedWords,
    } = req.body;

    if (!enrollmentId || !taskId || score === undefined) {
      return res.status(400).json({ success: false, message: "enrollmentId, taskId, score required" });
    }

    const student = await Student.findOne({ enrollmentId });
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });

    await SpeechLog.create({
      studentId: student._id, enrollmentId, taskId,
      stepIndex: stepIndex ?? 0,
      stepText:  stepText  ?? "",
      spokenText: spokenText ?? "",
      score,
      matchedWords: matchedWords ?? [],
      missedWords:  missedWords  ?? [],
    });

    // Award points for good speech
    let pointsAwarded = 0;
    if (score >= 90) {
      await PointsLog.create({ studentId: student._id, enrollmentId, taskId, event: "speech_score_great", points: 10 });
      pointsAwarded = 10;
    } else if (score >= 70) {
      await PointsLog.create({ studentId: student._id, enrollmentId, taskId, event: "speech_score_good", points: 5 });
      pointsAwarded = 5;
    }

    return res.status(201).json({ success: true, score, pointsAwarded });
  } catch (error) {
    console.error("logSpeechAttempt error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * GET /api/speech/student/:enrollmentId
 * Teacher views speech logs for a student. Optional ?taskId=
 */
export const getStudentSpeechLogs = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const { taskId } = req.query;

    const student = await Student.findOne({ enrollmentId });
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    const query = { studentId: student._id };
    if (taskId) query.taskId = taskId;

    const logs = await SpeechLog.find(query)
      .sort({ createdAt: -1 }).limit(100)
      .populate("taskId", "title").lean();

    // Build per-task summary
    const byTask = {};
    logs.forEach((l) => {
      const key = l.taskId?._id?.toString() || "unknown";
      if (!byTask[key]) byTask[key] = { taskTitle: l.taskId?.title || "?", scores: [], missed: [] };
      byTask[key].scores.push(l.score);
      byTask[key].missed.push(...(l.missedWords || []));
    });

    const summary = Object.entries(byTask).map(([tid, v]) => ({
      taskId: tid,
      taskTitle: v.taskTitle,
      avgScore: Math.round(v.scores.reduce((a, b) => a + b, 0) / v.scores.length),
      attempts: v.scores.length,
      topMissed: [...new Set(v.missed)].slice(0, 5),
    }));

    return res.json({ success: true, count: logs.length, logs, summary });
  } catch (error) {
    console.error("getStudentSpeechLogs error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
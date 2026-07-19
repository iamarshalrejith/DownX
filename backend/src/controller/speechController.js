import SpeechLog  from "../models/SpeechLog.js";
import SpeechPracticeItem from "../models/SpeechPracticeItem.js";
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

    if (!enrollmentId || score === undefined) {
      return res.status(400).json({ success: false, message: "enrollmentId and score are required" });
    }

    const student = await Student.findOne({ enrollmentId });
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    // taskId is optional — standalone Speech Practice items aren't tied
    // to a task. Only validate it exists when one was actually provided.
    let task = null;
    if (taskId) {
      task = await Task.findById(taskId);
      if (!task) return res.status(404).json({ success: false, message: "Task not found" });
    }

    await SpeechLog.create({
      studentId: student._id, enrollmentId, taskId: taskId || null,
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
      await PointsLog.create({ studentId: student._id, enrollmentId, taskId: taskId || null, event: "speech_score_great", points: 10 });
      pointsAwarded = 10;
    } else if (score >= 70) {
      await PointsLog.create({ studentId: student._id, enrollmentId, taskId: taskId || null, event: "speech_score_good", points: 5 });
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

// ═══════════════════════════════════════════════════════════════════════
//  Speech Practice — standalone from tasks (teacher-curated phrases +
//  auto-collected words the student has already seen in their tasks)
// ═══════════════════════════════════════════════════════════════════════

/**
 * POST /api/speech/practice
 * Teacher adds a phrase for a specific student or for all their students.
 * Body: { phrase, studentId, assignedToAll }
 */
export const createPracticeItem = async (req, res) => {
  try {
    const { phrase, studentId, assignedToAll } = req.body;

    if (!phrase?.trim()) {
      return res.status(400).json({ success: false, message: "phrase is required" });
    }
    if (!assignedToAll && !studentId) {
      return res.status(400).json({ success: false, message: "studentId or assignedToAll is required" });
    }

    const item = await SpeechPracticeItem.create({
      phrase: phrase.trim(),
      assignedTo: assignedToAll ? null : studentId,
      assignedToAll: !!assignedToAll,
      createdBy: req.user._id,
    });

    return res.status(201).json({ success: true, item });
  } catch (error) {
    console.error("createPracticeItem error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * GET /api/speech/practice?studentId=<id>
 * Teacher view — list phrases for a given student (or all, if omitted).
 */
export const listPracticeItems = async (req, res) => {
  try {
    const { studentId } = req.query;
    const query = studentId
      ? { $or: [{ assignedTo: studentId }, { assignedToAll: true }] }
      : {};

    const items = await SpeechPracticeItem.find(query)
      .sort({ createdAt: -1 })
      .populate("assignedTo", "name enrollmentId")
      .lean();

    return res.json({ success: true, items });
  } catch (error) {
    console.error("listPracticeItems error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * DELETE /api/speech/practice/:id
 * Teacher removes a practice phrase they created.
 */
export const deletePracticeItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await SpeechPracticeItem.findById(id);
    if (!item) return res.status(404).json({ success: false, message: "Not found" });

    await item.deleteOne();
    return res.json({ success: true });
  } catch (error) {
    console.error("deletePracticeItem error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * GET /api/speech/practice/student/:enrollmentId
 * Student-facing combined list: teacher-curated phrases assigned to them,
 * plus distinct step text auto-collected from their own tasks — so the
 * standalone Speech Practice section always has something in it even if
 * a teacher hasn't curated anything yet.
 */
export const getStudentPracticeList = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const student = await Student.findOne({ enrollmentId });
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    const teacherItems = await SpeechPracticeItem.find({
      $or: [{ assignedTo: student._id }, { assignedToAll: true }],
    })
      .sort({ createdAt: -1 })
      .select("phrase")
      .lean();

    const tasks = await Task.find({
      $or: [{ assignedTo: student._id }, { assignedToAll: true }],
    })
      .select("simplifiedSteps")
      .lean();

    const seen = new Set();
    const taskWords = [];
    for (const task of tasks) {
      for (const step of task.simplifiedSteps || []) {
        const key = step.trim().toLowerCase();
        if (!key || seen.has(key)) continue;
        seen.add(key);
        taskWords.push(step);
      }
    }

    return res.json({
      success: true,
      teacherItems: teacherItems.map((i) => ({ _id: i._id, phrase: i.phrase })),
      taskWords: taskWords.slice(0, 30),
    });
  } catch (error) {
    console.error("getStudentPracticeList error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
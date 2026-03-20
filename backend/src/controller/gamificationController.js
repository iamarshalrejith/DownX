import PointsLog from "../models/PointsLog.js";
import Student   from "../models/Student.js";

/**
 * POST /api/gamification/award
 * Body: { enrollmentId, event, taskId? }
 * Awards points for a specific event.
 */
export const awardPoints = async (req, res) => {
  try {
    const { enrollmentId, event, taskId } = req.body;

    const POINTS_MAP = {
      task_complete:      10,
      speech_score_good:   5,
      speech_score_great: 10,
      streak_bonus:       15,
      object_verified:     5,
    };

    if (!enrollmentId || !event || !POINTS_MAP[event]) {
      return res.status(400).json({ success: false, message: "Invalid enrollmentId or event" });
    }

    const student = await Student.findOne({ enrollmentId });
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    const points = POINTS_MAP[event];

    await PointsLog.create({
      studentId: student._id,
      enrollmentId,
      event,
      points,
      taskId: taskId || null,
    });

    // Get updated total
    const agg = await PointsLog.aggregate([
      { $match: { studentId: student._id } },
      { $group: { _id: null, total: { $sum: "$points" } } },
    ]);
    const total = agg[0]?.total || 0;

    return res.status(201).json({ success: true, pointsAwarded: points, total });
  } catch (error) {
    console.error("awardPoints error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * GET /api/gamification/student/:enrollmentId
 * Returns total points, level, badge, recent events.
 */
export const getStudentPoints = async (req, res) => {
  try {
    const { enrollmentId } = req.params;

    const student = await Student.findOne({ enrollmentId });
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    const logs = await PointsLog.find({ studentId: student._id })
      .sort({ createdAt: -1 }).limit(50)
      .populate("taskId", "title").lean();

    const total = logs.reduce((sum, l) => sum + l.points, 0);

    // Level system: every 50 pts = 1 level
    const level  = Math.floor(total / 50) + 1;
    const xpInLevel    = total % 50;
    const xpForNext    = 50;

    // Badge tiers
    const getBadge = (pts) => {
      if (pts >= 500) return { name: "Champion",  emoji: "🏆", color: "yellow" };
      if (pts >= 200) return { name: "Star",       emoji: "⭐", color: "purple" };
      if (pts >= 100) return { name: "Explorer",   emoji: "🚀", color: "blue"   };
      if (pts >= 50)  return { name: "Achiever",   emoji: "🎯", color: "green"  };
      return               { name: "Beginner",   emoji: "🌱", color: "gray"   };
    };

    return res.json({
      success: true,
      total,
      level,
      xpInLevel,
      xpForNext,
      badge: getBadge(total),
      recentEvents: logs.slice(0, 10),
    });
  } catch (error) {
    console.error("getStudentPoints error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * GET /api/gamification/leaderboard
 * Teacher sees all linked students ranked by points.
 * Protected — uses req.user to find students.
 */
export const getLeaderboard = async (req, res) => {
  try {
    const students = await Student.find({ caretakers: req.user._id }).select("name enrollmentId");

    const results = await Promise.all(
      students.map(async (s) => {
        const agg = await PointsLog.aggregate([
          { $match: { studentId: s._id } },
          { $group: { _id: null, total: { $sum: "$points" } } },
        ]);
        const total = agg[0]?.total || 0;
        return { studentId: s._id, name: s.name, enrollmentId: s.enrollmentId, total };
      })
    );

    results.sort((a, b) => b.total - a.total);

    return res.json({ success: true, leaderboard: results });
  } catch (error) {
    console.error("getLeaderboard error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
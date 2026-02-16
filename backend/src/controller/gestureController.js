import GestureEvent from '../models/GestureEvent.js';
import Student from '../models/Student.js';
import Task from '../models/Task.js';
import { notifyTeacher } from '../utils/notificationService.js';

// Log a gesture event
export const logGesture = async (req, res) => {
  try {
    const { enrollmentId, gestureType, confidence, taskId, context } = req.body;

    // Validate
    if (!enrollmentId || !gestureType || confidence === undefined) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Find student
    const student = await Student.findOne({ enrollmentId });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Create gesture event
    const gestureEvent = await GestureEvent.create({
      studentId: student._id,
      enrollmentId,
      gestureType,
      confidence,
      taskId: taskId || null,
      context: context || {},
      teacherNotified: gestureType === 'raised_hand' // Auto-notify for help requests
    });

    // If it's a help request -> notify teacher/parent
    if (gestureType === 'raised_hand') {
      await notifyTeacher(student, gestureEvent);
    }

    res.status(201).json({
      success: true,
      gestureEvent
    });

  } catch (error) {
    console.error('Gesture log error:', error);
    res.status(500).json({ message: 'Server error logging gesture' });
  }
};

// Get recent gesture events for a student
export const getStudentGestures = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const limit = parseInt(req.query.limit) || 20;

    const student = await Student.findOne({ enrollmentId });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const gestures = await GestureEvent.find({ studentId: student._id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('taskId', 'title');

    res.json({ gestures });

  } catch (error) {
    console.error('Get gestures error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get unresolved help requests for teacher
export const getHelpRequests = async (req, res) => {
  try {
    const { teacherId } = req.user; // From auth middleware

    // Find all students linked to this teacher
    const students = await Student.find({ linkedCaretakers: teacherId });
    const studentIds = students.map(s => s._id);

    // Find unresolved help requests
    const helpRequests = await GestureEvent.find({
      studentId: { $in: studentIds },
      gestureType: 'raised_hand',
      resolved: false
    })
    .sort({ createdAt: -1 })
    .populate('studentId', 'firstName lastName enrollmentId')
    .populate('taskId', 'title');

    res.json({ helpRequests });

  } catch (error) {
    console.error('Get help requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark gesture as resolved
export const resolveGesture = async (req, res) => {
  try {
    const { gestureId } = req.params;
    const { responseNote } = req.body;

    const gesture = await GestureEvent.findByIdAndUpdate(
      gestureId,
      {
        resolved: true,
        'teacherResponse.respondedAt': new Date(),
        'teacherResponse.responseNote': responseNote || 'Resolved'
      },
      { new: true }
    );

    if (!gesture) {
      return res.status(404).json({ message: 'Gesture event not found' });
    }

    res.json({ success: true, gesture });

  } catch (error) {
    console.error('Resolve gesture error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
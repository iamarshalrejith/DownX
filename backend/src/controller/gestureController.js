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
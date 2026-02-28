import express from 'express';
import {
  logGesture,
  getStudentGestures,
  getHelpRequests,
  resolveGesture
} from '../controller/gestureController.js';
import { protect} from '../middleware/authmiddleware.js';
import { roleGuard } from '../middleware/roleGuard.js';

const router = express.Router();

// Log a gesture (student or public endpoint)
router.post('/log', logGesture);

// Get student's gesture history (protected)
router.get('/student/:enrollmentId', protect, getStudentGestures);

// Get help requests (teacher/parent only)
router.get('/help-requests', protect, roleGuard(['teacher', 'parent']), getHelpRequests);

// Resolve a gesture (teacher/parent only)
router.patch('/:gestureId/resolve', protect, roleGuard(['teacher', 'parent']), resolveGesture);

export default router;
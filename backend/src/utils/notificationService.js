// For now, this will log to console
// Later (Day 46+), integrate with WebSockets or push notifications

export const notifyTeacher = async (student, gestureEvent) => {
  try {
    console.log(`HELP REQUEST from ${student.firstName} ${student.lastName}`);
    console.log(`Enrollment ID: ${student.enrollmentId}`);
    console.log(`Gesture: ${gestureEvent.gestureType}`);
    console.log(`Confidence: ${gestureEvent.confidence}`);
    console.log(`Task: ${gestureEvent.taskId || "No active task"}`);

    // TODO: Implement real-time notification (WebSocket/Socket.io)
    // For MVP, teachers will poll the /api/gestures/help-requests endpoint

    return true;
  } catch (error) {
    console.error("Notification error:", error);
    return false;
  }
};

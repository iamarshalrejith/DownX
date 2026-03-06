/**
 * Notification Service
 *
 * Day 46+  : Replace with Socket.io real-time push
 */

export const notifyTeacher = async (student, gestureEvent) => {
  try {
    console.log("════════════════════════════════════════");
    console.log(" HELP REQUEST RECEIVED");
    console.log("════════════════════════════════════════");
    console.log(`  Student     : ${student.name}`);
    console.log(`  Enrollment  : ${student.enrollmentId}`);
    console.log(`  Gesture     : ${gestureEvent.gestureType.replace(/_/g, " ").toUpperCase()}`);
    console.log(`  Confidence  : ${(gestureEvent.confidence * 100).toFixed(0)}%`);
    console.log(`  Task        : ${gestureEvent.taskId || "No active task"}`);
    console.log(`  Time        : ${new Date().toLocaleString()}`);
    console.log("════════════════════════════════════════");

    // TODO (Day 46+): emit via Socket.io
    // io.to(`teacher_${caretakerId}`).emit("help_request", { student, gestureEvent });

    return true;
  } catch (error) {
    console.error("Notification error:", error);
    return false;
  }
};
import Student from "../models/Student.js";

export const loadStudentByEnrollmentId = async (req, res, next) => {
  try {
    const { enrollmentId } = req.body;

    if (!enrollmentId) {
      return res.status(400).json({
        message: "Enrollment ID is required",
      });
    }

    const student = await Student.findOne({ enrollmentId });

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    // Attach student to request
    req.student = student;

    next();
  } catch (error) {
    next(error);
  }
};

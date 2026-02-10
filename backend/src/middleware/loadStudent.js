import Student from "../models/Student.js";

export const loadStudentByEnrollmentId = async (req, res, next) => {
  try {
    const { enrollmentId } = req.body;

    console.log("Loading student with ID:", enrollmentId);

    if (!enrollmentId) {
      return res.status(400).json({
        message: "Enrollment ID is required",
      });
    }

    // Check if this is a face-related route
    const isFaceRoute = 
      req.originalUrl.includes('face-login') || 
      req.originalUrl.includes('face-enroll');
    
    console.log("Is face route:", isFaceRoute);
    console.log("Original URL:", req.originalUrl);
    
    let student;
    if (isFaceRoute) {
      student = await Student.findOne({ enrollmentId }).select('+faceEmbedding');
      console.log("Loaded with embedding, length:", student?.faceEmbedding?.length);
    } else {
      student = await Student.findOne({ enrollmentId });
    }

    if (!student) {
      console.log("Student not found");
      return res.status(404).json({
        message: "Student not found",
      });
    }

    console.log("Student loaded:", student.name);

    req.student = student;

    next();
  } catch (error) {
    console.error("Load student error:", error);
    next(error);
  }
};
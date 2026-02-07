export const biometricGuard = async (req, res, next) => {
  const student = req.student;

  console.log("Biometric guard check");
  
  if (!student) {
    console.log("Student not loaded");
    return res.status(500).json({
      message: "Student not loaded before biometric check",
    });
  }

  console.log("Student:", student.name);
  console.log("Is active:", student.isActive);
  console.log("Face auth enabled:", student.faceAuthEnabled);
  console.log("Has embedding:", !!student.faceEmbedding);

  if (!student.isActive) {
    console.log("Student not active");
    return res.status(403).json({
      message: "Student account is disabled",
    });
  }

  if (!student.faceAuthEnabled) {
    console.log("Face auth not enabled");
    return res.status(403).json({
      message: "Face authentication is not enabled",
    });
  }

  console.log("Biometric guard passed");
  next();
};
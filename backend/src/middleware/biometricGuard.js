export const biometricGuard = (req, res, next) => {
  const student = req.student;

  if (!student) {
    return res.status(500).json({
      message: "Student not loaded before biometric check",
    });
  }

  if (!student.isActive) {
    return res.status(403).json({
      message: "Student account is disabled",
    });
  }

  if (!student.faceAuthEnabled) {
    return res.status(403).json({
      message: "Face authentication is not enabled",
    });
  }

  next();
};

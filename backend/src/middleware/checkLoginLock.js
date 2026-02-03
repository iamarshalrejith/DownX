export const checkLoginLock = (req, res, next) => {
  const student = req.student;

  if (!student) {
    return res.status(500).json({
      message: "Student context missing",
    });
  }

  if (
    student.loginLockUntil &&
    student.loginLockUntil > new Date()
  ) {
    const remainingMs =
      student.loginLockUntil - new Date();

    const remainingMinutes = Math.ceil(
      remainingMs / (1000 * 60)
    );

    return res.status(429).json({
      message: `Please wait ${remainingMinutes} minute(s) and try again.`,
      locked: true,
    });
  }

  next();
};

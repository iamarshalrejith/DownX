const attempts = new Map();

/**
 * Rate limiter for student login routes
 * Limits attempts per Enrollment ID
 */
export const rateLimiter = (maxAttempts = 5, windowMs = 5 * 60 * 1000) => {
  return (req, res, next) => {
    const { enrollmentId } = req.body;

    if (!enrollmentId) {
      return res.status(400).json({
        message: "Enrollment ID required",
      });
    }

    const now = Date.now();
    const record = attempts.get(enrollmentId);

    if (!record) {
      attempts.set(enrollmentId, {
        count: 1,
        firstAttempt: now,
      });
      return next();
    }

    // Reset window
    if (now - record.firstAttempt > windowMs) {
      attempts.set(enrollmentId, {
        count: 1,
        firstAttempt: now,
      });
      return next();
    }

    // Too many attempts
    if (record.count >= maxAttempts) {
      return res.status(429).json({
        message: "Too many attempts. Please wait and try again.",
      });
    }

    record.count += 1;
    attempts.set(enrollmentId, record);

    next();
  };
};


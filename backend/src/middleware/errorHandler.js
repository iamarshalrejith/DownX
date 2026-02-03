export const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);

  // Check err.statusCode or err.status first, then default to 500
  const statusCode = err.statusCode || err.status || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
};

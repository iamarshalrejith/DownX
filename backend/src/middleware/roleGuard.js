/**
 * Role-based access control middleware
 * Supports both: roleGuard("teacher", "parent") AND roleGuard(["teacher","parent"])
 */
export const roleGuard = (...args) => {
  // Flatten: handle roleGuard(["a","b"]) and roleGuard("a","b") identically
  const allowedRoles = args.flat();

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Required roles: ${allowedRoles.join(", ")}`,
      });
    }

    next();
  };
};

/**
 * Role-based access control middleware
 * Usage:
 *   roleGuard("teacher")
 *   roleGuard("teacher", "parent")
 */

export const roleGuard = (...allowedRoles) => {
  return (req, res, next) => {
    // req.user is assumed to be set by auth middleware
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const userRole = req.user.role;

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        message: "Access denied for this role",
      });
    }

    next();
  };
};



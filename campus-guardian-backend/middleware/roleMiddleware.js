/**
 * Restricts a route to a set of allowed roles.
 * Usage: requireRole("admin"), requireRole("staff", "admin")
 * Must be used AFTER the `protect` middleware since it relies on req.user.
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, please log in",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Requires role(s): ${allowedRoles.join(", ")}`,
      });
    }

    next();
  };
};

module.exports = requireRole;

/**
 * Shortcut middleware restricting a route to admin users only.
 * Must be used AFTER the `protect` middleware since it relies on req.user.
 */
const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Not authorized, please log in",
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admins only.",
    });
  }

  next();
};

module.exports = adminOnly;

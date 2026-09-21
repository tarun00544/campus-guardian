const express = require("express");
const {
  getDashboardStats,
  getAllComplaints,
  getAllEmergencies,
  getAllLostFoundItems,
  getAllUsers,
  getAssignableUsers,
  updateUserRole,
  updateUserStatus,
  getAnalytics,
} = require("../controllers/adminController");
const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");
const requireRole = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect);

router.get("/dashboard", adminOnly, getDashboardStats);
router.get("/analytics", adminOnly, getAnalytics);
router.get("/complaints", requireRole("admin", "staff", "security"), getAllComplaints);
router.get("/emergencies", requireRole("admin", "security"), getAllEmergencies);
router.get("/lost-found", requireRole("admin", "security"), getAllLostFoundItems);
router.get("/users", adminOnly, getAllUsers);
router.get("/assignable-users", adminOnly, getAssignableUsers);
router.put("/users/:id/role", adminOnly, updateUserRole);
router.put("/users/:id/status", adminOnly, updateUserStatus);

module.exports = router;

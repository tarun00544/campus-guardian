const express = require("express");
const {
  getDashboardStats,
  getAllComplaints,
  getAllEmergencies,
  getAllLostFoundItems,
  getAllUsers,
  updateUserRole,
  updateUserStatus,
  getAnalytics,
} = require("../controllers/adminController");
const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");

const router = express.Router();

router.use(protect, adminOnly);

router.get("/dashboard", getDashboardStats);
router.get("/analytics", getAnalytics);
router.get("/complaints", getAllComplaints);
router.get("/emergencies", getAllEmergencies);
router.get("/lost-found", getAllLostFoundItems);
router.get("/users", getAllUsers);
router.put("/users/:id/role", updateUserRole);
router.put("/users/:id/status", updateUserStatus);

module.exports = router;

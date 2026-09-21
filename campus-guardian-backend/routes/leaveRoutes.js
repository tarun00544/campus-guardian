const express = require("express");
const {
  createLeave,
  getMyLeaves,
  getAllLeaves,
  reviewLeave,
  getLeaveQr,
  scanLeaveQr,
} = require("../controllers/leaveController");
const protect = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect);

// Leave applications themselves are only student <-> admin.
router.post("/", requireRole("student"), createLeave);
router.get("/my", requireRole("student"), getMyLeaves);
router.get("/admin", requireRole("admin"), getAllLeaves);
router.put("/admin/:id", requireRole("admin"), reviewLeave);
router.get("/:id/qr", requireRole("student"), getLeaveQr);

// Scanning is an operational action for security/admin, not a leave-application role.
router.post("/scan", requireRole("security", "admin"), scanLeaveQr);

module.exports = router;

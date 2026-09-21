const express = require("express");
const {
  createEmergency,
  getEmergencies,
  getMyEmergencies,
  getEmergencyById,
  updateEmergencyStatus,
  deleteEmergency,
} = require("../controllers/emergencyController");
const protect = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect);

router
  .route("/")
  .post(createEmergency)
  .get(requireRole("security", "admin"), getEmergencies);

router.get("/my", getMyEmergencies);
router.get("/:id", getEmergencyById);
router.put("/:id/status", requireRole("security", "admin"), updateEmergencyStatus);
router.delete("/:id", requireRole("admin"), deleteEmergency);

module.exports = router;

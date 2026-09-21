const express = require("express");
const { createLeave, getMyLeaves, getAllLeaves, reviewLeave } = require("../controllers/leaveController");
const protect = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect);
router.post("/", requireRole("student"), createLeave);
router.get("/my", requireRole("student"), getMyLeaves);
router.get("/admin", requireRole("admin"), getAllLeaves);
router.put("/admin/:id", requireRole("admin"), reviewLeave);

module.exports = router;

const express = require("express");
const {
  createComplaint,
  getComplaints,
  getMyComplaints,
  getComplaintById,
  updateComplaint,
  deleteComplaint,
  upvoteComplaint,
  updateComplaintStatus,
  assignComplaint,
} = require("../controllers/complaintController");
const protect = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

router.use(protect);

router.route("/").post(upload.single("image"), createComplaint).get(getComplaints);

router.get("/my", getMyComplaints);

router
  .route("/:id")
  .get(getComplaintById)
  .put(upload.single("image"), updateComplaint)
  .delete(deleteComplaint);

router.post("/:id/upvote", upvoteComplaint);
router.put("/:id/status", requireRole("staff", "security", "admin"), updateComplaintStatus);
router.put("/:id/assign", requireRole("admin"), assignComplaint);

module.exports = router;

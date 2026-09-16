const express = require("express");
const {
  createLostFoundItem,
  getLostFoundItems,
  getMyLostFoundItems,
  getLostFoundItemById,
  updateLostFoundItem,
  deleteLostFoundItem,
  getPossibleMatches,
  requestVerification,
  verifyRecovery,
} = require("../controllers/lostFoundController");
const protect = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

router.use(protect);

router
  .route("/")
  .post(upload.single("image"), createLostFoundItem)
  .get(getLostFoundItems);

router.get("/my", getMyLostFoundItems);

router
  .route("/:id")
  .get(getLostFoundItemById)
  .put(upload.single("image"), updateLostFoundItem)
  .delete(deleteLostFoundItem);

router.get("/:id/matches", getPossibleMatches);
router.post("/:id/request-verification", requestVerification);
router.put("/:id/verify", requireRole("security", "admin"), verifyRecovery);

module.exports = router;

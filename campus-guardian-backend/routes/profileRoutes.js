 const express = require("express");

const {
  getProfile,
  updateProfile,
  changePassword,
} = require("../controllers/profileController");

const auth = require("../middleware/authMiddleware");

const router = express.Router();

// All profile routes require login
router.use(auth);

// GET /api/profile
router.get("/", getProfile);

// PUT /api/profile
router.put("/", updateProfile);

// PUT /api/profile/password
router.put("/password", changePassword);

module.exports = router;
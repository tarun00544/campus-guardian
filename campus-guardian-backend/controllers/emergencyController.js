const Emergency = require("../models/Emergency");
const User = require("../models/User");
const createNotification = require("../utils/createNotification");

// @desc    Create an emergency alert
// @route   POST /api/emergencies
// @access  Private
const createEmergency = async (req, res, next) => {
  try {
    const { type, description, location, latitude, longitude } = req.body;

    const validTypes = ["Medical", "Fire", "Accident", "Security", "Harassment", "Other"];

    if (!type || !validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Emergency type must be one of: ${validTypes.join(", ")}`,
      });
    }

    const emergency = await Emergency.create({
      reportedBy: req.user._id,
      type,
      description: description || "",
      location: location || "",
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      status: "Active",
    });

    // Notify all security and admin users so they can respond.
    const authorities = await User.find({ role: { $in: ["security", "admin"] } }).select("_id");

    await Promise.all(
      authorities.map((authority) =>
        createNotification({
          user: authority._id,
          title: `New ${type} emergency reported`,
          message: `${req.user.name} reported a ${type} emergency${location ? ` at ${location}` : ""}`,
          type: "emergency",
          relatedId: emergency._id,
        })
      )
    );

    res.status(201).json({
      success: true,
      message:
        "Emergency alert sent. This is an in-app alert only - if this is life-threatening, also contact campus security or local emergency services directly.",
      data: emergency,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all emergency alerts
// @route   GET /api/emergencies
// @access  Private (security, admin)
const getEmergencies = async (req, res, next) => {
  try {
    const { status, type } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (type) filter.type = type;

    const emergencies = await Emergency.find(filter)
      .populate("reportedBy", "name email phone role")
      .populate("respondedBy", "name email role")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Emergencies fetched successfully",
      data: emergencies,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get emergency alerts created by the logged-in user
// @route   GET /api/emergencies/my
// @access  Private
const getMyEmergencies = async (req, res, next) => {
  try {
    const emergencies = await Emergency.find({ reportedBy: req.user._id })
      .populate("respondedBy", "name email role")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Your emergency alerts fetched successfully",
      data: emergencies,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single emergency alert
// @route   GET /api/emergencies/:id
// @access  Private
const getEmergencyById = async (req, res, next) => {
  try {
    const emergency = await Emergency.findById(req.params.id)
      .populate("reportedBy", "name email phone role")
      .populate("respondedBy", "name email role");

    if (!emergency) {
      return res.status(404).json({
        success: false,
        message: "Emergency alert not found",
      });
    }

    const isOwner = emergency.reportedBy._id.toString() === req.user._id.toString();
    const isAuthority = ["security", "admin"].includes(req.user.role);

    if (!isOwner && !isAuthority) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this emergency alert",
      });
    }

    res.status(200).json({
      success: true,
      message: "Emergency alert fetched successfully",
      data: emergency,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update emergency status (respond / resolve / cancel)
// @route   PUT /api/emergencies/:id/status
// @access  Private (security, admin)
const updateEmergencyStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ["Active", "Responding", "Resolved", "Cancelled"];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const emergency = await Emergency.findById(req.params.id);

    if (!emergency) {
      return res.status(404).json({
        success: false,
        message: "Emergency alert not found",
      });
    }

    emergency.status = status;

    if (status === "Responding" && !emergency.responseTime) {
      emergency.responseTime = new Date();
      emergency.respondedBy = req.user._id;
    }

    if (status === "Resolved") {
      emergency.resolvedAt = new Date();
      if (!emergency.respondedBy) emergency.respondedBy = req.user._id;
    }

    await emergency.save();

    await createNotification({
      user: emergency.reportedBy,
      title: "Emergency alert update",
      message: `Your emergency alert is now marked as "${status}"`,
      type: "emergency",
      relatedId: emergency._id,
    });

    res.status(200).json({
      success: true,
      message: "Emergency status updated successfully",
      data: emergency,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createEmergency,
  getEmergencies,
  getMyEmergencies,
  getEmergencyById,
  updateEmergencyStatus,
};

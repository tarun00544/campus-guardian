const User = require("../models/User");
const Complaint = require("../models/Complaint");
const Emergency = require("../models/Emergency");
const LostFound = require("../models/LostFound");

// @desc    Get dashboard summary stats
// @route   GET /api/admin/dashboard
// @access  Private (admin)
const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalComplaints,
      pendingComplaints,
      inProgressComplaints,
      resolvedComplaints,
      totalEmergencies,
      activeEmergencies,
      totalLostItems,
      totalFoundItems,
      matchedItems,
    ] = await Promise.all([
      User.countDocuments(),
      Complaint.countDocuments(),
      Complaint.countDocuments({ status: { $in: ["Reported", "Assigned"] } }),
      Complaint.countDocuments({ status: "In Progress" }),
      Complaint.countDocuments({ status: "Resolved" }),
      Emergency.countDocuments(),
      Emergency.countDocuments({ status: { $in: ["Active", "Responding"] } }),
      LostFound.countDocuments({ type: "lost" }),
      LostFound.countDocuments({ type: "found" }),
      LostFound.countDocuments({ status: { $in: ["Matched", "Recovered"] } }),
    ]);

    res.status(200).json({
      success: true,
      message: "Dashboard stats fetched successfully",
      data: {
        totalUsers,
        totalComplaints,
        pendingComplaints,
        inProgressComplaints,
        resolvedComplaints,
        totalEmergencies,
        activeEmergencies,
        totalLostItems,
        totalFoundItems,
        matchedItems,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all complaints (admin view)
// @route   GET /api/admin/complaints
// @access  Private (admin)
const getAllComplaints = async (req, res, next) => {
  try {
    const filter = {};
    const currentRole = String(req.user.role || "").trim().toLowerCase();
    if (["staff", "security"].includes(currentRole)) {
      filter.assignedTo = req.user._id;
    }

    const complaints = await Complaint.find(filter)
      .populate("reportedBy", "name email phone role")
      .populate("assignedTo", "name email phone role")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "All complaints fetched successfully",
      data: complaints,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all emergencies (admin view)
// @route   GET /api/admin/emergencies
// @access  Private (admin)
const getAllEmergencies = async (req, res, next) => {
  try {
    const emergencies = await Emergency.find()
      .populate("reportedBy", "name email phone role")
      .populate("respondedBy", "name email role")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "All emergencies fetched successfully",
      data: emergencies,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all lost & found items (admin view)
// @route   GET /api/admin/lost-found
// @access  Private (admin)
const getAllLostFoundItems = async (req, res, next) => {
  try {
    const items = await LostFound.find()
      .populate("reportedBy", "name email role")
      .populate("verifiedBy", "name email role")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "All lost & found items fetched successfully",
      data: items,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (admin)
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "All users fetched successfully",
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a user's role
// @route   PUT /api/admin/users/:id/role
// @access  Private (admin)
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const validRoles = ["student", "staff", "security", "admin"];

    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Role must be one of: ${validRoles.join(", ")}`,
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.role = role;
    await user.save();

    res.status(200).json({
      success: true,
      message: "User role updated successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Activate/deactivate a user
// @route   PUT /api/admin/users/:id/status
// @access  Private (admin)
const updateUserStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be a boolean value",
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.isActive = isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User has been ${isActive ? "activated" : "deactivated"} successfully`,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};


// @desc    Get active staff/security users available for assignment
// @route   GET /api/admin/assignable-users
// @access  Private (admin)
const getAssignableUsers = async (req, res, next) => {
  try {
    const users = await User.find({
      role: { $in: ["staff", "security"] },
      isActive: true,
    })
      .select("_id name email phone role isActive")
      .sort({ role: 1, name: 1 });

    res.status(200).json({
      success: true,
      message: "Assignable staff and security users fetched successfully",
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get analytics data
// @route   GET /api/admin/analytics
// @access  Private (admin)
const getAnalytics = async (req, res, next) => {
  try {
    const [
      complaintsByCategory,
      complaintsByLocation,
      complaintsByStatus,
      emergenciesByType,
      lostFoundByStatus,
      lostFoundByType,
    ] = await Promise.all([
      Complaint.aggregate([
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Complaint.aggregate([
        { $group: { _id: "$location", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Complaint.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Emergency.aggregate([
        { $group: { _id: "$type", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      LostFound.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      LostFound.aggregate([
        { $group: { _id: "$type", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    res.status(200).json({
      success: true,
      message: "Analytics fetched successfully",
      data: {
        complaintsByCategory,
        complaintsByLocation,
        complaintsByStatus,
        emergenciesByType,
        lostFoundStatistics: {
          byStatus: lostFoundByStatus,
          byType: lostFoundByType,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getAllComplaints,
  getAllEmergencies,
  getAllLostFoundItems,
  getAllUsers,
  getAssignableUsers,
  updateUserRole,
  updateUserStatus,
  getAnalytics,
};

const mongoose = require("mongoose");
const Complaint = require("../models/Complaint");
const User = require("../models/User");
const calculatePriority = require("../utils/priorityCalculator");
const createNotification = require("../utils/createNotification");

// @desc    Create a new complaint
// @route   POST /api/complaints
// @access  Private (student, staff, security, admin)
const createComplaint = async (req, res, next) => {
  try {
    const { title, description, category, location } = req.body;

    if (!title || !description || !category || !location) {
      return res.status(400).json({
        success: false,
        message: "Title, description, category and location are required",
      });
    }

    const image = req.file ? `/uploads/${req.file.filename}` : null;

    const priority = calculatePriority(category, 0);

    const complaint = await Complaint.create({
      title,
      description,
      category,
      location,
      image,
      reportedBy: req.user._id,
      priority,
    });

    // Notify all admins about the new complaint
 

const admins = await User.find({
  role: "admin",
  isActive: true,
}).select("_id");

await Promise.all(
  admins.map((admin) =>
    createNotification({
      user: admin._id,
      title: "New complaint reported",
      message: `${req.user.name} reported "${complaint.title}" at ${complaint.location}`,
      type: "complaint",
      relatedId: complaint._id,
    })
  )
);

    res.status(201).json({
      success: true,
      message: "Complaint reported successfully",
      data: complaint,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get complaints (role-aware feed)
//          admin -> all complaints
//          staff -> complaints assigned to them
//          student/security -> all complaints (public feed for visibility/upvoting)
// @route   GET /api/complaints
// @access  Private
const getComplaints = async (req, res, next) => {
  try {
    const { status, category, location, priority } = req.query;

    const filter = {};

    const currentRole = String(req.user.role || "").trim().toLowerCase();
    if (["staff", "security"].includes(currentRole)) {
      filter.assignedTo = req.user._id;
    }

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (location) filter.location = location;
    if (priority) filter.priority = priority;

    const complaints = await Complaint.find(filter)
      .populate("reportedBy", "name email role")
      .populate("assignedTo", "name email role")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Complaints fetched successfully",
      data: complaints,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get complaints reported by the logged-in user
// @route   GET /api/complaints/my
// @access  Private
const getMyComplaints = async (req, res, next) => {
  try {
    const complaints = await Complaint.find({ reportedBy: req.user._id })
      .populate("assignedTo", "name email role")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Your complaints fetched successfully",
      data: complaints,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single complaint by id
// @route   GET /api/complaints/:id
// @access  Private
const getComplaintById = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate("reportedBy", "name email role")
      .populate("assignedTo", "name email role");

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Complaint fetched successfully",
      data: complaint,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a complaint (owner can edit content, staff/admin can edit management fields)
// @route   PUT /api/complaints/:id
// @access  Private
const updateComplaint = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    const isOwner = complaint.reportedBy.toString() === req.user._id.toString();
    const currentRole = String(req.user.role || "").trim().toLowerCase();
    const isPrivileged = ["admin", "staff"].includes(currentRole);

    if (!isOwner && !isPrivileged) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this complaint",
      });
    }

    // Students (owners) may only edit their own complaint's basic content,
    // and only while it is still in "Reported" status.
    if (isOwner && !isPrivileged) {
      if (complaint.status !== "Reported") {
        return res.status(400).json({
          success: false,
          message: "Complaint can no longer be edited once it is being handled",
        });
      }

      const { title, description, category, location } = req.body;
      if (title) complaint.title = title;
      if (description) complaint.description = description;
      if (category) complaint.category = category;
      if (location) complaint.location = location;
      if (req.file) complaint.image = `/uploads/${req.file.filename}`;
    } else {
      // Admin/staff editing - allow broader field updates except status/assign,
      // which have their own dedicated endpoints for clear auditing.
      const { title, description, category, location } = req.body;
      if (title) complaint.title = title;
      if (description) complaint.description = description;
      if (category) complaint.category = category;
      if (location) complaint.location = location;
      if (req.file) complaint.image = `/uploads/${req.file.filename}`;
    }

    await complaint.save();

    res.status(200).json({
      success: true,
      message: "Complaint updated successfully",
      data: complaint,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a complaint
// @route   DELETE /api/complaints/:id
// @access  Private (owner or admin)
const deleteComplaint = async (req, res, next) => {
  try {
    if (String(req.user.role || "").trim().toLowerCase() !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can delete complaints",
      });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found" });
    }

    await complaint.deleteOne();

    res.status(200).json({
      success: true,
      message: "Complaint deleted successfully",
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upvote a complaint
// @route   POST /api/complaints/:id/upvote
// @access  Private
const upvoteComplaint = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    const alreadyUpvoted = complaint.upvotedBy.some(
      (userId) => userId.toString() === req.user._id.toString()
    );

    if (alreadyUpvoted) {
      return res.status(400).json({
        success: false,
        message: "You have already upvoted this complaint",
      });
    }

    complaint.upvotedBy.push(req.user._id);
    complaint.upvotes = complaint.upvotedBy.length;
    complaint.priority = calculatePriority(complaint.category, complaint.upvotes);

    await complaint.save();

    res.status(200).json({
      success: true,
      message: "Complaint upvoted successfully",
      data: complaint,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update complaint status
// @route   PUT /api/complaints/:id/status
// @access  Private (staff, admin)
const updateComplaintStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ["Reported", "Assigned", "In Progress", "Resolved", "Rejected"];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    // Staff and security may only update complaints assigned to them.
    if (
      ["staff", "security"].includes(req.user.role) &&
      (!complaint.assignedTo || complaint.assignedTo.toString() !== req.user._id.toString())
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only update complaints assigned to you",
      });
    }

    complaint.status = status;
    if (status === "Resolved") {
      complaint.resolvedAt = new Date();
    }

    await complaint.save();

    await createNotification({
      user: complaint.reportedBy,
      title: "Complaint status updated",
      message: `Your complaint "${complaint.title}" is now marked as "${status}"`,
      type: "complaint",
      relatedId: complaint._id,
    });

    res.status(200).json({
      success: true,
      message: "Complaint status updated successfully",
      data: complaint,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign a complaint to a staff/security member
// @route   PUT /api/complaints/:id/assign
// @access  Private (admin)
const assignComplaint = async (req, res, next) => {
  try {
    const { assignedTo } = req.body;

    if (!assignedTo || !mongoose.Types.ObjectId.isValid(assignedTo)) {
      return res.status(400).json({
        success: false,
        message: "A valid staff/security user must be selected",
      });
    }

    const assignee = await User.findOne({
      _id: assignedTo,
      role: { $in: ["staff", "security"] },
      isActive: true,
    }).select("_id name email role");

    if (!assignee) {
      return res.status(400).json({
        success: false,
        message: "Select an active staff or security user from the assignment list",
      });
    }

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    complaint.assignedTo = assignedTo;
    complaint.status = "Assigned";

    await complaint.save();

    await createNotification({
      user: assignedTo,
      title: "New complaint assigned to you",
      message: `You have been assigned the complaint: "${complaint.title}"`,
      type: "complaint",
      relatedId: complaint._id,
    });

    await createNotification({
      user: complaint.reportedBy,
      title: "Complaint assigned",
      message: `Your complaint "${complaint.title}" has been assigned to a staff member`,
      type: "complaint",
      relatedId: complaint._id,
    });

    res.status(200).json({
      success: true,
      message: "Complaint assigned successfully",
      data: complaint,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createComplaint,
  getComplaints,
  getMyComplaints,
  getComplaintById,
  updateComplaint,
  deleteComplaint,
  upvoteComplaint,
  updateComplaintStatus,
  assignComplaint,
};

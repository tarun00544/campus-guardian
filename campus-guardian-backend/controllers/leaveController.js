const LeaveApplication = require("../models/LeaveApplication");
const User = require("../models/User");
const createNotification = require("../utils/createNotification");

const studentView = (leave) => ({
  _id: leave._id,
  destination: leave.destination,
  fromDate: leave.fromDate,
  toDate: leave.toDate,
  purpose: leave.purpose,
  status: leave.status,
  adminNote: leave.adminNote,
  reviewedAt: leave.reviewedAt,
  createdAt: leave.createdAt,
  updatedAt: leave.updatedAt,
});

const adminView = (leave) => ({
  ...studentView(leave),
  student: leave.student ? {
    _id: leave.student._id,
    name: leave.student.name,
    email: leave.student.email,
    phone: leave.student.phone,
    role: leave.student.role,
  } : null,
  reviewedBy: leave.reviewedBy ? {
    _id: leave.reviewedBy._id,
    name: leave.reviewedBy.name,
    email: leave.reviewedBy.email,
  } : null,
});

const createLeave = async (req, res, next) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ success: false, message: "Only students can submit leave applications" });
    }

    const { destination, fromDate, toDate, purpose } = req.body;
    if (!destination || !fromDate || !toDate || !purpose) {
      return res.status(400).json({ success: false, message: "Destination, start time, end time and purpose are required" });
    }

    const start = new Date(fromDate);
    const end = new Date(toDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return res.status(400).json({ success: false, message: "Please provide valid dates and times" });
    }
    if (end <= start) {
      return res.status(400).json({ success: false, message: "End time must be after start time" });
    }

    const pending = await LeaveApplication.findOne({ student: req.user._id, status: "Pending" });
    if (pending) {
      return res.status(409).json({ success: false, message: "You already have a pending leave application" });
    }

    const leave = await LeaveApplication.create({
      student: req.user._id,
      destination,
      fromDate: start,
      toDate: end,
      purpose,
    });

    const admins = await User.find({ role: "admin", isActive: true }).select("_id");
    await Promise.all(admins.map((admin) => createNotification({
      user: admin._id,
      title: "New leave application",
      message: `${req.user.name} submitted a leave request for ${destination}.`,
      type: "system",
      relatedId: leave._id,
    })));

    const populated = await LeaveApplication.findById(leave._id).populate("student", "name email phone role");
    res.status(201).json({ success: true, message: "Leave application sent to admin", data: studentView(populated) });
  } catch (error) {
    next(error);
  }
};

const getMyLeaves = async (req, res, next) => {
  try {
    const leaves = await LeaveApplication.find({ student: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: leaves.map(studentView) });
  } catch (error) {
    next(error);
  }
};

const getAllLeaves = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status && req.query.status !== "All") filter.status = req.query.status;
    const leaves = await LeaveApplication.find(filter)
      .populate("student", "name email phone role")
      .populate("reviewedBy", "name email")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: leaves.map(adminView) });
  } catch (error) {
    next(error);
  }
};

const reviewLeave = async (req, res, next) => {
  try {
    const { status, adminNote = "" } = req.body;
    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Status must be Approved or Rejected" });
    }

    const leave = await LeaveApplication.findById(req.params.id);
    if (!leave) return res.status(404).json({ success: false, message: "Leave application not found" });
    if (leave.status !== "Pending") {
      return res.status(409).json({ success: false, message: "This leave application has already been reviewed" });
    }

    leave.status = status;
    leave.adminNote = String(adminNote || "").trim();
    leave.reviewedBy = req.user._id;
    leave.reviewedAt = new Date();
    await leave.save();

    await createNotification({
      user: leave.student,
      title: `Leave ${status.toLowerCase()}`,
      message: `Your leave application for ${leave.destination} has been ${status.toLowerCase()}.${leave.adminNote ? ` Note: ${leave.adminNote}` : ""}`,
      type: "system",
      relatedId: leave._id,
    });

    const populated = await LeaveApplication.findById(leave._id)
      .populate("student", "name email phone role")
      .populate("reviewedBy", "name email");
    res.json({ success: true, message: `Leave ${status.toLowerCase()}`, data: adminView(populated) });
  } catch (error) {
    next(error);
  }
};

module.exports = { createLeave, getMyLeaves, getAllLeaves, reviewLeave };

 const jwt = require("jsonwebtoken");
const LeaveApplication = require("../models/LeaveApplication");
const User = require("../models/User");
const createNotification = require("../utils/createNotification");

// The frontend uses <input type="datetime-local">, which intentionally sends
// a date/time without a timezone (for example: 2026-09-25T05:06).
// The app is intended for India, so interpret that value as IST instead of
// letting Node/Render interpret it in the server's UTC timezone.
const parseIndiaDateTime = (value) => {
  if (typeof value !== "string") return new Date(value);

  const trimmed = value.trim();
  // Already timezone-aware: keep the supplied timezone/offset.
  if (/([zZ]|[+-]\d{2}:?\d{2})$/.test(trimmed)) {
    return new Date(trimmed);
  }

  // datetime-local values have no timezone. Treat them as Asia/Kolkata (IST).
  const normalized = trimmed.length === 16 ? `${trimmed}:00` : trimmed;
  return new Date(`${normalized}+05:30`);
};

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
  qrScanCount: leave.qrScanCount || 0,
  qrFirstScannedAt: leave.qrFirstScannedAt,
  qrSecondScannedAt: leave.qrSecondScannedAt,
  qrExpiredAt: leave.qrExpiredAt,
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

    const start = parseIndiaDateTime(fromDate);
    const end = parseIndiaDateTime(toDate);
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
  } catch (error) { next(error); }
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
  } catch (error) { next(error); }
};

const deleteLeave = async (req, res, next) => {
  try {
    const leave = await LeaveApplication.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ success: false, message: "Leave application not found" });
    }

    await leave.deleteOne();
    res.json({ success: true, message: "Leave application deleted successfully", data: {} });
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
    if (leave.status !== "Pending") return res.status(409).json({ success: false, message: "This leave application has already been reviewed" });

    leave.status = status;
    leave.adminNote = String(adminNote || "").trim();
    leave.reviewedBy = req.user._id;
    leave.reviewedAt = new Date();

    // A fresh QR lifecycle starts only when admin approves the request.
    if (status === "Approved") {
      leave.qrScanCount = 0;
      leave.qrFirstScannedAt = null;
      leave.qrSecondScannedAt = null;
      leave.qrExpiredAt = null;
    }

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
  } catch (error) { next(error); }
};

// Student asks for a short-lived signed QR payload only after approval.
const getLeaveQr = async (req, res, next) => {
  try {
    const leave = await LeaveApplication.findOne({ _id: req.params.id, student: req.user._id });
    if (!leave) return res.status(404).json({ success: false, message: "Leave application not found" });
    if (leave.status !== "Approved") return res.status(400).json({ success: false, message: "QR is available only for approved leave" });
    if ((leave.qrScanCount || 0) >= 2) return res.status(410).json({ success: false, message: "This QR code has already been used twice and is expired" });
    // The QR may be displayed as soon as the leave is approved.
    // The scanner below still enforces the approved departure/return window,
    // so displaying the QR early does not allow an early departure scan.
    if (new Date() > new Date(leave.toDate)) return res.status(410).json({ success: false, message: "This leave QR has expired because the return time has passed" });

    const expiresAt = new Date(leave.toDate).getTime();
    const token = jwt.sign(
      { type: "campus_leave_qr", leaveId: leave._id.toString(), studentId: req.user._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: Math.max(60, Math.floor((expiresAt - Date.now()) / 1000)) }
    );

    res.json({
      success: true,
      data: {
        token,
        leaveId: leave._id,
        scanCount: leave.qrScanCount || 0,
        nextScan: (leave.qrScanCount || 0) === 0 ? "OUT" : "IN",
        expiresAt: leave.toDate,
      },
    });
  } catch (error) { next(error); }
};

// Security/admin scanner: exactly two successful scans, then the QR is permanently expired.
const scanLeaveQr = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, message: "QR token is required" });

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(410).json({ success: false, message: "Invalid or expired QR code" });
    }

    if (decoded.type !== "campus_leave_qr" || !decoded.leaveId) {
      return res.status(400).json({ success: false, message: "This is not a valid Campus Guardian leave QR" });
    }

    const now = new Date();
    const leave = await LeaveApplication.findById(decoded.leaveId).populate("student", "name email phone role");
    if (!leave) return res.status(404).json({ success: false, message: "Leave application not found" });
    if (leave.status !== "Approved") return res.status(409).json({ success: false, message: "This leave is not approved" });
    if (leave.student?._id.toString() !== decoded.studentId) return res.status(403).json({ success: false, message: "QR student mismatch" });
    if (now < new Date(leave.fromDate)) return res.status(409).json({ success: false, message: "This leave QR is not active until the approved departure time" });
    if (now > new Date(leave.toDate)) return res.status(410).json({ success: false, message: "This leave QR has expired" });
    if ((leave.qrScanCount || 0) >= 2) return res.status(410).json({ success: false, message: "QR already scanned twice. It is now expired." });

    const currentCount = leave.qrScanCount || 0;
    const update = {
      $inc: { qrScanCount: 1 },
      ...(currentCount === 0
        ? { $set: { qrFirstScannedAt: now } }
        : { $set: { qrSecondScannedAt: now, qrExpiredAt: now } }),
    };

    // Optimistic concurrency: only the scanner that still sees this exact
    // scan count can consume the next scan. This prevents double-scanning
    // two browser/camera requests at the same time.
    const consumed = await LeaveApplication.updateOne(
      { _id: leave._id, status: "Approved", $and: [{ qrScanCount: currentCount }, { qrScanCount: { $lt: 2 } }] },
      update
    );

    if (consumed.modifiedCount !== 1) {
      return res.status(409).json({
        success: false,
        message: "This QR scan was already consumed. Please refresh the student's QR.",
      });
    }

    const nextCount = currentCount + 1;
    const scanType = currentCount === 0 ? "OUT / departure" : "IN / return";
    await createNotification({
      user: leave.student._id,
      title: `Leave QR scanned: ${scanType}`,
      message: `Your approved leave QR was scanned for ${scanType} by ${req.user.name}.`,
      type: "system",
      relatedId: leave._id,
    });

    res.json({
      success: true,
      message: `${scanType} scan successful${nextCount >= 2 ? ". QR is now expired." : ". One scan remains."}`,
      data: {
        leaveId: leave._id,
        scanCount: leave.qrScanCount,
        scanType,
        qrExpired: leave.qrScanCount >= 2,
        student: leave.student,
        destination: leave.destination,
        fromDate: leave.fromDate,
        toDate: leave.toDate,
      },
    });
  } catch (error) { next(error); }
};

module.exports = {
  createLeave,
  getMyLeaves,
  getAllLeaves,
  reviewLeave,
  deleteLeave,
  getLeaveQr,
  scanLeaveQr,
};

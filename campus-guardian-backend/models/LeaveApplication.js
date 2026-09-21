const mongoose = require("mongoose");

const leaveApplicationSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    destination: { type: String, required: true, trim: true, maxlength: 200 },
    fromDate: { type: Date, required: true },
    toDate: { type: Date, required: true },
    purpose: { type: String, required: true, trim: true, maxlength: 1000 },
    status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending", index: true },
    adminNote: { type: String, trim: true, maxlength: 500, default: "" },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    reviewedAt: { type: Date, default: null },

    // QR lifecycle: 0 = unused, 1 = OUT/departure scan used, 2 = IN/return scan used.
    qrScanCount: { type: Number, default: 0, min: 0, max: 2 },
    qrFirstScannedAt: { type: Date, default: null },
    qrSecondScannedAt: { type: Date, default: null },
    qrExpiredAt: { type: Date, default: null },
  },
  { timestamps: true }
);

leaveApplicationSchema.index({ student: 1, createdAt: -1 });

module.exports = mongoose.model("LeaveApplication", leaveApplicationSchema);

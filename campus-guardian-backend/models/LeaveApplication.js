const mongoose = require("mongoose");

const leaveApplicationSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    destination: {
      type: String,
      required: [true, "Destination is required"],
      trim: true,
      maxlength: 200,
    },
    fromDate: {
      type: Date,
      required: [true, "Start date and time are required"],
    },
    toDate: {
      type: Date,
      required: [true, "End date and time are required"],
    },
    purpose: {
      type: String,
      required: [true, "Purpose is required"],
      trim: true,
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
      index: true,
    },
    adminNote: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

leaveApplicationSchema.index({ student: 1, createdAt: -1 });

module.exports = mongoose.model("LeaveApplication", leaveApplicationSchema);

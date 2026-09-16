const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    category: {
      type: String,
      enum: [
        "Wi-Fi",
        "Electricity",
        "Water",
        "Washroom",
        "Classroom",
        "Furniture",
        "Cleanliness",
        "Other",
      ],
      required: [true, "Category is required"],
    },
    image: {
      type: String,
      default: null,
    },
    location: {
      type: String,
      enum: [
        "Block A",
        "Block B",
        "Hostel",
        "Library",
        "Cafeteria",
        "Main Gate",
        "Academic Block",
        "Ground",
        "Parking",
        "Other",
      ],
      required: [true, "Location is required"],
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: ["Reported", "Assigned", "In Progress", "Resolved", "Rejected"],
      default: "Reported",
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Low",
    },
    upvotes: {
      type: Number,
      default: 0,
    },
    upvotedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Complaint", complaintSchema);

const mongoose = require("mongoose");

const lostFoundSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["lost", "found"],
      required: [true, "Type is required (lost or found)"],
    },
    itemName: {
      type: String,
      required: [true, "Item name is required"],
      trim: true,
    },
    category: {
      type: String,
      enum: [
        "Mobile",
        "Laptop",
        "ID Card",
        "Wallet",
        "Keys",
        "Bag",
        "Book",
        "Accessory",
        "Other",
      ],
      required: [true, "Category is required"],
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    image: {
      type: String,
      default: null,
    },
    location: {
      type: String,
      trim: true,
      required: [true, "Location is required"],
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: [
        "Active",
        "Matched",
        "Verification Pending",
        "Recovered",
        "Closed",
      ],
      default: "Active",
    },
    matchedItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LostFound",
      default: null,
    },
    matchScore: {
      type: Number,
      default: null,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    recoveredAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("LostFound", lostFoundSchema);

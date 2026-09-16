const LostFound = require("../models/LostFound");
const calculateMatchScore = require("../utils/matchCalculator");
const createNotification = require("../utils/createNotification");

const MATCH_THRESHOLD = 40; // minimum score to be considered a "possible match"

// @desc    Create a lost or found item report
// @route   POST /api/lost-found
// @access  Private
const createLostFoundItem = async (req, res, next) => {
  try {
    const { type, itemName, category, description, location, date } = req.body;

    if (!type || !["lost", "found"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type must be either "lost" or "found"',
      });
    }

    if (!itemName || !category || !location || !date) {
      return res.status(400).json({
        success: false,
        message: "itemName, category, location and date are required",
      });
    }

    const image = req.file ? `/uploads/${req.file.filename}` : null;

    const item = await LostFound.create({
      type,
      itemName,
      category,
      description: description || "",
      location,
      date,
      image,
      reportedBy: req.user._id,
    });

    // Look for possible matches on the opposite type (lost <-> found)
    const oppositeType = type === "lost" ? "found" : "lost";
    const candidates = await LostFound.find({
      type: oppositeType,
      status: { $in: ["Active", "Matched"] },
    });

    let bestMatch = null;
    let bestScore = 0;

    for (const candidate of candidates) {
      const { score } = calculateMatchScore(item, candidate);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = candidate;
      }
    }

    if (bestMatch && bestScore >= MATCH_THRESHOLD) {
      item.matchedItem = bestMatch._id;
      item.matchScore = bestScore;
      item.status = "Matched";
      await item.save();

      await createNotification({
        user: item.reportedBy,
        title: "Possible match found!",
        message: `We found a possible match (${bestScore}%) for your ${type} item "${item.itemName}"`,
        type: "lostfound",
        relatedId: item._id,
      });

      await createNotification({
        user: bestMatch.reportedBy,
        title: "Possible match found!",
        message: `We found a possible match (${bestScore}%) for your ${oppositeType} item "${bestMatch.itemName}"`,
        type: "lostfound",
        relatedId: bestMatch._id,
      });
    }

    res.status(201).json({
      success: true,
      message: "Item reported successfully",
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all lost & found items (public feed)
// @route   GET /api/lost-found
// @access  Private
const getLostFoundItems = async (req, res, next) => {
  try {
    const { type, category, status, location } = req.query;
    const filter = {};

    if (type) filter.type = type;
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (location) filter.location = location;

    const items = await LostFound.find(filter)
      .populate("reportedBy", "name email role")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Lost & found items fetched successfully",
      data: items,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get items reported by the logged-in user
// @route   GET /api/lost-found/my
// @access  Private
const getMyLostFoundItems = async (req, res, next) => {
  try {
    const items = await LostFound.find({ reportedBy: req.user._id }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      message: "Your lost & found items fetched successfully",
      data: items,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single lost & found item
// @route   GET /api/lost-found/:id
// @access  Private
const getLostFoundItemById = async (req, res, next) => {
  try {
    const item = await LostFound.findById(req.params.id).populate(
      "reportedBy",
      "name email role"
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Item fetched successfully",
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a lost & found item
// @route   PUT /api/lost-found/:id
// @access  Private (owner or admin)
const updateLostFoundItem = async (req, res, next) => {
  try {
    const item = await LostFound.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    const isOwner = item.reportedBy.toString() === req.user._id.toString();

    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this item",
      });
    }

    const { itemName, category, description, location, date } = req.body;
    if (itemName) item.itemName = itemName;
    if (category) item.category = category;
    if (description) item.description = description;
    if (location) item.location = location;
    if (date) item.date = date;
    if (req.file) item.image = `/uploads/${req.file.filename}`;

    await item.save();

    res.status(200).json({
      success: true,
      message: "Item updated successfully",
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a lost & found item
// @route   DELETE /api/lost-found/:id
// @access  Private (owner or admin)
const deleteLostFoundItem = async (req, res, next) => {
  try {
    const item = await LostFound.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    const isOwner = item.reportedBy.toString() === req.user._id.toString();

    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this item",
      });
    }

    await item.deleteOne();

    res.status(200).json({
      success: true,
      message: "Item deleted successfully",
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get possible matches for a lost/found item
// @route   GET /api/lost-found/:id/matches
// @access  Private
const getPossibleMatches = async (req, res, next) => {
  try {
    const item = await LostFound.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    const oppositeType = item.type === "lost" ? "found" : "lost";

    const candidates = await LostFound.find({
      _id: { $ne: item._id },
      type: oppositeType,
      status: { $in: ["Active", "Matched", "Verification Pending"] },
    }).populate("reportedBy", "name role");

    const matches = candidates
      .map((candidate) => {
        const { score, reasons } = calculateMatchScore(item, candidate);
        return {
          item: candidate,
          matchScore: score,
          reasons,
        };
      })
      .filter((match) => match.matchScore >= MATCH_THRESHOLD)
      .sort((a, b) => b.matchScore - a.matchScore);

    res.status(200).json({
      success: true,
      message: "Possible matches fetched successfully",
      data: matches,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Request verification for a matched item (claim ownership)
// @route   POST /api/lost-found/:id/request-verification
// @access  Private
const requestVerification = async (req, res, next) => {
  try {
    const item = await LostFound.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    if (item.status === "Recovered" || item.status === "Closed") {
      return res.status(400).json({
        success: false,
        message: `Item is already ${item.status.toLowerCase()}`,
      });
    }

    item.status = "Verification Pending";
    await item.save();

    // Notify admins to review and confirm the recovery.
    await createNotification({
      user: item.reportedBy,
      title: "Verification requested",
      message: `Verification has been requested for "${item.itemName}". An admin will review it shortly.`,
      type: "lostfound",
      relatedId: item._id,
    });

    res.status(200).json({
      success: true,
      message: "Verification requested successfully. An admin will confirm the match.",
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Confirm recovery / verify a match (owner-confirmed items only)
// @route   PUT /api/lost-found/:id/verify
// @access  Private (admin, security)
const verifyRecovery = async (req, res, next) => {
  try {
    const item = await LostFound.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    item.status = "Recovered";
    item.verifiedBy = req.user._id;
    item.recoveredAt = new Date();

    await item.save();

    // Mark the linked matched item as recovered too, if present.
    if (item.matchedItem) {
      const linkedItem = await LostFound.findById(item.matchedItem);
      if (linkedItem && linkedItem.status !== "Recovered") {
        linkedItem.status = "Recovered";
        linkedItem.verifiedBy = req.user._id;
        linkedItem.recoveredAt = new Date();
        await linkedItem.save();

        await createNotification({
          user: linkedItem.reportedBy,
          title: "Item recovered",
          message: `Your item "${linkedItem.itemName}" has been verified and marked as recovered`,
          type: "lostfound",
          relatedId: linkedItem._id,
        });
      }
    }

    await createNotification({
      user: item.reportedBy,
      title: "Item recovered",
      message: `Your item "${item.itemName}" has been verified and marked as recovered`,
      type: "lostfound",
      relatedId: item._id,
    });

    res.status(200).json({
      success: true,
      message: "Item verified and marked as recovered",
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createLostFoundItem,
  getLostFoundItems,
  getMyLostFoundItems,
  getLostFoundItemById,
  updateLostFoundItem,
  deleteLostFoundItem,
  getPossibleMatches,
  requestVerification,
  verifyRecovery,
};

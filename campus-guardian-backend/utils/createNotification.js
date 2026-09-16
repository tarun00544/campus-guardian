const Notification = require("../models/Notification");

/**
 * Creates an in-app notification for a user.
 * Failures are logged but never thrown, so a notification failure
 * never breaks the main request flow (e.g. creating a complaint).
 *
 * @param {Object} params
 * @param {String} params.user - target user id
 * @param {String} params.title
 * @param {String} params.message
 * @param {"complaint"|"emergency"|"lostfound"|"system"} params.type
 * @param {String} [params.relatedId] - id of the related resource
 */
const createNotification = async ({ user, title, message, type, relatedId = null }) => {
  try {
    await Notification.create({ user, title, message, type, relatedId });
  } catch (error) {
    console.error("Failed to create notification:", error.message);
  }
};

module.exports = createNotification;

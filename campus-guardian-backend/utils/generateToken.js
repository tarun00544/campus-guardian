const jwt = require("jsonwebtoken");

/**
 * Generate a signed JWT for a given user id.
 * @param {String} userId - Mongo ObjectId of the user
 * @returns {String} signed JWT
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

module.exports = generateToken;

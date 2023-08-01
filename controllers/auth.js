const ErrorResponse = require("../utils/errorResponse"); // Custom error response
const User = require("../models/User");

// @desc    Register user
// @route   GET /api/v1/auth/register
// @access  PUBLIC
const registerUser = async (req, res, next) => {
  res.status(200).json({
    success: true,
  });
};

module.exports = {
  registerUser,
};

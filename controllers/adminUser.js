const ErrorResponse = require("../utils/errorResponse"); // Custom error response
const User = require("../models/User");

// @desc    Get all users
// @route   GET /api/v1/admin
// @access  PRIVATE (admin only)
const getUsers = async (req, res, next) => {
  try {
    // Return advanced results with pagination, etc using advancedResults middleware
    res.status(200).json(res.advancedResults);
  } catch (e) {
    next(e);
  }
};

// @desc    Get single user
// @route   GET /api/v1/admin/:id
// @access  PRIVATE (admin only)
const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (e) {
    next(e);
  }
};

// @desc    Create user
// @route   POST /api/v1/admin
// @access  PRIVATE (admin only)
const createUser = async (req, res, next) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json({
      success: true,
      data: user,
    });
  } catch (e) {
    next(e);
  }
};

// @desc    Update user
// @route   PUT /api/v1/admin/:id
// @access  PRIVATE (admin only)
const updateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        $set: { name: req.body.name, email: req.body.email },
      },
      {
        new: true,
        runValidators: true,
      }
    );
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (e) {
    next(e);
  }
};

// @desc    Delete user
// @route   DELETE /api/v1/admin/:id
// @access  PRIVATE (admin only)
const deleteUser = async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (e) {
    next(e);
  }
};

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
};

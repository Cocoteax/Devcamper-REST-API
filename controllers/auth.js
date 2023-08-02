const ErrorResponse = require("../utils/errorResponse"); // Custom error response
const User = require("../models/User");

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  PUBLIC
const registerUser = async (req, res, next) => {
  try {
    const { name, email, role, password } = req.body;

    // Create user
    // NOTE: Our schema will validate the registration details of new user
    const user = await User.create({
      name,
      email,
      password,
      role,
    });

    // Get JWT for user
    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      token: token,
    });
  } catch (e) {
    next(e);
  }
};

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  PUBLIC
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check if user entered email and password
    if (!email || !password) {
      return next(
        new ErrorResponse("Please provide an email and password", 400)
      );
    }

    // Check for user based on email
    // NOTE: "+password" includes password into the result, recall that password is hidden since we set "select": false in schema
    const user = await User.findOne({ email: email }).select("+password");
    if (!user) {
      return next(new ErrorResponse(`Invalid Credentials`, 401));
    }

    // Validate password using schema method (Alternatively, we can do it here directly too)
    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      return next(new ErrorResponse(`Invalid Credentials`, 401));
    }

    // Valid user, retrieve JWT and return
    const token = user.getSignedJwtToken();
    res.status(200).json({
      success: true,
      token: token,
    });
  } catch (e) {
    next(e);
  }
};

module.exports = {
  registerUser,
  loginUser,
};

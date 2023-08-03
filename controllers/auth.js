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

    // Registration successful, send back token response
    sendTokenResponse(user, 200, res);
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

    // Valid user, send back token response
    sendTokenResponse(user, 200, res);
  } catch (e) {
    next(e);
  }
};

// @desc    Get current logged in user
// @route   POST /api/v1/auth/me
// @access  PRIVATE
const getCurrentUser = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: req.user, // req.user is set by protectRoute middleware
    });
  } catch (e) {
    next(e);
  }
};

// Custom function to get token from model, set cookie, and send response
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();
  const options = {
    // Date(ms) => Need to set expires to 30 days
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 1000 * 60 * 60 * 24
    ),
    httpOnly: true, // Ensure cookies can only be manipulated by server and not client
  };

  // Set secure flag HTTPS if in production
  if (process.env.NODE_ENV === "production") {
    options.secure = true;
  }

  // Send back response with status and set cookie with res.cookie
  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    token: token,
  });
};

module.exports = {
  registerUser,
  getCurrentUser,
  loginUser,
};

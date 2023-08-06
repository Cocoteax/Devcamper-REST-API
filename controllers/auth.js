const ErrorResponse = require("../utils/errorResponse"); // Custom error response
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");

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

// @desc    Forgot password, generate password reset token, and send email to user with link to reset password
// @route   POST /api/v1/auth/forgotpassword
// @access  PUBLIC
const forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    // Check if user is valid
    if (!user) {
      return next(new ErrorResponse(`There is no user with that email`, 404));
    }

    // Get reset token by calling schema method .getResetPasswordToken
    // NOTE: this method generates a hashed reset password token for the user and stores it into db
    const resetToken = await user.getResetPasswordToken();

    // Create reset URL
    // NOTE: If we have react frontend, we can display this link and let users click onto it to perform a PUT request to reset password
    const resetURL = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/auth/resetpassword/${resetToken}`;

    const message = `You are receiving this email because you have requested for a reset of your password. Please make a PUT request to: \n\n${resetURL}`;

    // Try/catch block to send email to user
    try {
      // sendEmail requires these 3 parameters as an option object (Refer to sendEmail.js utility)
      await sendEmail({
        email: user.email,
        subject: "Password reset token",
        message: message,
      });
      res.status(200).json({ success: true, data: "Email sent successfully" });
    } catch (e) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      user.save({ validateBeforeSave: false });
      return next(new ErrorResponse(`Email could not be sent`, 500));
    }
  } catch (e) {
    next(e);
  }
};

// @desc    Reset password using reset token password from email
// @route   PUT /api/v1/auth/resetpassword/:resetToken
// @access  PUBLIC
const resetPassword = async (req, res, next) => {
  try {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.resetToken)
      .digest("hex");

    // Get current user based on resetPasswordToken, and ensure that token has not expired
    const user = await User.findOne({
      resetPasswordToken: resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return next(new ErrorResponse(`Invalid token`, 400));
    }

    // Update user password and clear resetToken
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    sendTokenResponse(user, 200, res);
  } catch (e) {
    next(e);
  }
};

// @desc    Update user details
// @route   PUT /api/v1/auth/updatedetails
// @access  PRIVATE
const updateDetails = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { name: req.body.name, email: req.body.email } },
      { new: true, runValidators: true } // new:true gives us back the updated user document
    );

    if (!user) {
      return next(new ErrorResponse("User is not valid", 400));
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (e) {
    next(e);
  }
};

// @desc    Update user password
// @route   PUT /api/v1/auth/updatepassword
// @access  PRIVATE
const updatePassword = async (req, res, next) => {
  try {
    // Need to bring in password field so we can use schema method to validate password
    let user = await User.findById(req.user.id).select("+password");
    if (!user) {
      return next(new ErrorResponse("User is not valid", 400));
    }

    // Validate old password
    const validOldPassword = await user.validatePassword(req.body.oldPassword);
    if (!validOldPassword) {
      return next(new ErrorResponse("Password is incorrect", 401));
    }

    // Update the password with .save() to allow pre-hook to encrypt password with bcrypt
    user.password = req.body.newPassword;
    await user.save({ validateBeforeSave: false });

    sendTokenResponse(user, 200, res);
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
  forgotPassword,
  resetPassword,
  updateDetails,
  updatePassword,
};

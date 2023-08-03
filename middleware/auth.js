const jwt = require("jsonwebtoken");
const ErrorResponse = require("../utils/errorResponse");
const User = require("../models/User");

// Middleware to authenticate users before they access a protected route (See route files on which routes are protected)
const protectRoute = async (req, res, next) => {
  try {
    let token;

    // If front-end uses Bearer JWT authentication, client will send JWT inside authorization header (See notes for entire process)
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    //   // Cookie authentication method
    //   else if (req.cookies.token) {
    //     token = req.cookies.token;
    //   }

    if (!token) {
      return next(
        new ErrorResponse("Not authorized to access this route", 401)
      );
    }

    // Verify token using jwt.verify
    // NOTE: If fail to verify, it will automatically throw an error and go to catch block
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    // Set current user with req.user, allowing other routes to access req.user if the route passes through this middleware
    req.user = await User.findById(decodedToken.id);
    next();
  } catch (e) {
    return next(new ErrorResponse("Not authorized to access this route", 401));
  }
};

module.exports = {
  protectRoute,
};

const ErrorReponse = require("../utils/errorResponse");

// @desc    Custom error handler for errors passed to express through an asynchronous fns (Whenever we call next(error) inside a try or catch block (See controllers))
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message; // Append err.message property to error since spread operator doesn't copy it over

  // Check for different types of errors based on err.name and handle them accordingly using our custom ErrorReponse
  // Mongoose bad ObjectID
  if (err.name === "CastError") {
    const message = `Resource not found with id of ${err.value}`; // err.value is a property of err that contains invalid objectID
    error = new ErrorReponse(message, 404); // Update error using our custom ErrorReponse object
  }

  // Mongoose duplicate keys
  if (err.code === 11000) {
    const message = `Duplicate field value entered for ${Object.keys(
      err.keyValue
    )}`;
    error = new ErrorReponse(message, 400);
  }

  // Mongoose validation error (Missing required fields)
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors).map(
      (val) => `${val.message} for the ${val.path} field`
    ); // Object.values() return all values from an object (excluding keys)
    error = new ErrorReponse(message.join(", "), 400);
  }

  return res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || "Server Error",
  });
};

module.exports = errorHandler;

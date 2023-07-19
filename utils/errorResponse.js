// @desc    Custom ErrorReponse class which extends Error class to accepts statusCodes for handling errors passed from asynchronous fns (See controllers)
class ErrorResponse extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

module.exports = ErrorResponse;

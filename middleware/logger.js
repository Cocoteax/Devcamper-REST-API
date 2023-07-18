// @desc    Custom defined logger to log requests to console
// @note    We won't use this and instead use a 3rd party logger
const logger = async (req, res, next) => {
  console.log(
    `${req.method}  ${req.protocol}://${req.get("host")}${req.originalUrl}  ${
      res.statusCode
    }`
  );
  next();
};

module.exports = logger;

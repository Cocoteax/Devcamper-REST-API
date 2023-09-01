const express = require("express");
const app = express();
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const path = require("path");
const fileupload = require("express-fileupload");
const errorHandler = require("./middleware/error");
const morgan = require("morgan"); // 3rd party logger
const cookieParser = require("cookie-parser");
const mongoSanitize = require("express-mongo-sanitize"); // Prevent sql injections
const helmet = require("helmet"); // Add security headers
const { xss } = require("express-xss-sanitizer"); // Prevent XSS attacks
const rateLimit = require("express-rate-limit"); // Protect against request spamming
const hpp = require("hpp"); // Protect against HTTP parameter pollution attacks
const cors = require("cors");
const connectDB = require("./config/db");

// Load env variables from config.env file into process.env
dotenv.config({ path: "./config/config.env" });
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV; // Get node env from npm scripts

// Import routes
const bootcampRoutes = require("./routes/bootcamps");
const courseRoutes = require("./routes/courses");
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/adminUser");
const reviewRoutes = require("./routes/reviews");

// ========== Set up middlewares ========== //
// Body parser for accessing request body
app.use(bodyParser.urlencoded({ extended: false })); // For FORM html elements
app.use(bodyParser.json()); // For JSON input

// Cookie parser for setting & accessing cookies
app.use(cookieParser());

// Logger for dev environment
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// File uploading
app.use(fileupload());

// API security - Preventing SQL Injections
app.use(mongoSanitize());

// API security - Add security headers
app.use(helmet({ contentSecurityPolicy: false }));

// API security - Prevent XSS attacks
app.use(xss());

// API security - Set a rate limit for requests to API
app.use(
  rateLimit({
    windowMs: 10 * 1000 * 60, //10 mins
    max: 100,
    message:
      "You can only make 100 requests every 10 mins. Please try again later.",
  })
);

// API security - Prevent HPP attacks
app.use(hpp());

// Enable API to be public so that it can be accessed by different domains (Required for full stack applications)
app.use(cors());

// Set static folder for serving static files such as images
// This allows the internet to be able to retrieve files from the local static folder by going to domain/uploads/filePath
app.use(express.static(path.join(__dirname, "public")));

// ========== Set up routes ========== //
app.use("/api/v1/bootcamps", bootcampRoutes);
app.use("/api/v1/courses", courseRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/reviews", reviewRoutes);

// Error handler middleware
// NOTE: This middleware must come after routes since we pass the error to errorHandler by calling next() within controllers
app.use(errorHandler);

// ========== Start Application ========== //
const startApp = async () => {
  try {
    await connectDB();
    console.log(path.join(__dirname, "public"));
    app.listen(
      PORT,
      console.log(`Server running in ${NODE_ENV} mode on port ${PORT}`)
    );
  } catch (e) {
    console.log(e);
  }
};

startApp();

module.exports = app;
const express = require("express");
const app = express();
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const errorHandler = require("./middleware/error");
const morgan = require("morgan"); // 3rd party logger
const connectDB = require("./config/db");

// Load env variables from config.env file into process.env
dotenv.config({ path: "./config/config.env" });
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV; // Get node env from npm scripts

// Import routes
const bootcampRoutes = require("./routes/bootcamps");

// ========== Set up middlewares ========== //
// Body parser for accessing request body
app.use(bodyParser.urlencoded({ extended: false })); // For FORM html elements
app.use(bodyParser.json()); // For JSON input

// Logger for dev environment
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// ========== Set up routes ========== //
app.use("/api/v1/bootcamps", bootcampRoutes.router);

// Error handler middleware
// NOTE: This middleware must come after routes since we pass the error to errorHandler by calling next() within controllers
app.use(errorHandler);

// ========== Start Application ========== //
const startApp = async () => {
  try {
    await connectDB();
    app.listen(
      PORT,
      console.log(`Server running in ${NODE_ENV} mode on port ${PORT}`)
    );
  } catch (e) {
    console.log(e);
  }
};

startApp();

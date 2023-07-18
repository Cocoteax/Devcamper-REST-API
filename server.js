const express = require("express");
const app = express();
const morgan = require("morgan"); // 3rd party logger

// Load env variables from config.env file into process.env
const dotenv = require("dotenv");
dotenv.config({ path: "./config/config.env" });
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV; // Get node env from npm scripts

// Import routes
const bootcampRoutes = require("./routes/bootcamps");

// ========== Set up middlewares ========== //
// Logger for dev environment
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// ========== Set up routes ========== //
app.use("/api/v1/bootcamps", bootcampRoutes.router);

app.listen(
  PORT,
  console.log(`Server running in ${NODE_ENV} mode on port ${PORT}`)
);

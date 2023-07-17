const express = require("express");
const dotenv = require("dotenv");

// Load env variables into process.env
dotenv.config({ path: "./config/config.env" });
const PORT = process.env.PORT || 3000;

const app = express();

app.listen(
  PORT,
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
);

// Script to import data into mongoDB automatically
const fs = require("fs");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const dotenv = require("dotenv");
const Bootcamp = require("./models/Bootcamp");
const Course = require("./models/Course");
dotenv.config({ path: "./config/config.env" });

// Connect to DB
connectDB();

// Read JSON data files
const bootcamps = JSON.parse(
  fs.readFileSync(`${__dirname}/_data/bootcamps.json`)
);
const courses = JSON.parse(
  fs.readFileSync(`${__dirname}/_data/courses.json`)
);

// Import JSON data into DB
const importData = async () => {
  try {
    await Bootcamp.create(bootcamps);
    await Course.create(courses);
    console.log("Data Imported...");
    process.exit();
  } catch (e) {
    console.log(e);
  }
};

// Delete all JSON data from DB
const deleteData = async () => {
  try {
    await Bootcamp.deleteMany();
    await Course.deleteMany();
    console.log("Data Deleted...");
    process.exit();
  } catch (e) {
    console.log(e);
  }
};

// Import or delete depending on how we run our seeder script in command line
if (process.argv[2] === "-i") {
  importData();
} else if (process.argv[2] === "-d") {
  deleteData();
}

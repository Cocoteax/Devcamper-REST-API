// Script to import data into mongoDB automatically
const fs = require("fs");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const dotenv = require("dotenv");
const Bootcamp = require("./models/Bootcamp");
const Course = require("./models/Course");
const User = require("./models/User");
const Review = require("./models/Review");
dotenv.config({ path: "./config/config.env" });

// Connect to DB
connectDB();

// Read JSON data files
const bootcamps = JSON.parse(
  fs.readFileSync(`${__dirname}/_data/bootcamps.json`)
);
const courses = JSON.parse(fs.readFileSync(`${__dirname}/_data/courses.json`));

const users = JSON.parse(fs.readFileSync(`${__dirname}/_data/users.json`));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/_data/reviews.json`));

// Import JSON data into DB
const importData = async () => {
  try {
    await Bootcamp.create(bootcamps);
    await Course.create(courses);
    await User.create(users);
    await Review.create(reviews);
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
    await User.deleteMany();
    await Review.deleteMany();
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

const express = require("express");
const router = express.Router({ mergeParams: true });

const courseController = require("../controllers/courses");
const advancedResults = require("../middleware/advancedResults");
const Course = require("../models/Course");
const { protectRoute, authorizeRoles } = require("../middleware/auth");

// /api/v1/courses
// /api/v1/bootcamp/:bootcampID/courses
// NOTE: route depends on where the request gets routed from, either server.js or bootcamps.js controller (re-routing)
router
  .route("/")
  .get(
    advancedResults(Course, {
      path: "bootcamp",
      select: "name description",
    }), // This end-point passes through these 2 middleware from left-to-right
    courseController.getCourses
  )
  .post(
    protectRoute,
    authorizeRoles("publisher", "admin"),
    courseController.createCourse
  );

// /api/v1/courses/:id
router
  .route("/:id")
  .get(courseController.getSingleCourse)
  .put(
    protectRoute,
    authorizeRoles("publisher", "admin"),
    courseController.updateCourse
  )
  .delete(
    protectRoute,
    authorizeRoles("publisher", "admin"),
    courseController.deleteCourse
  );

module.exports = router;

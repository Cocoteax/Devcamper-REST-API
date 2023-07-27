const express = require("express");
const router = express.Router({ mergeParams: true });

const courseController = require("../controllers/courses");

// /api/v1/courses
// /api/v1/bootcamp/:bootcampID/courses
// NOTE: route depends on where the request gets routed from, either server.js or bootcamps.js controller (re-routing)
router
  .route("/")
  .get(courseController.getCourses)
  .post(courseController.createCourse);

// /api/v1/courses/:id
router
  .route("/:id")
  .get(courseController.getSingleCourse)
  .put(courseController.updateCourse)
  .delete(courseController.deleteCourse);

module.exports = router;

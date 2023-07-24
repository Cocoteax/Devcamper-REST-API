const ErrorResponse = require("../utils/errorResponse"); // Custom error response
const Course = require("../models/Course");
const Bootcamp = require("../models/Bootcamp");

// @desc    Get courses (Either all or from a particular bootcamp depending on route)
// @route   GET /api/v1/courses
// @route   GET /api/v1/bootcamps/:bootcampID/courses
// @access  PUBLIC
const getCourses = async (req, res, next) => {
  try {
    let query;
    // Get courses from particular bootcamp
    if (req.params.bootcampID) {
      // Check if bootcamp exists
      const bootcamp = await Bootcamp.findById(req.params.bootcampID);
      if (!bootcamp) {
        return next(
          new ErrorResponse(
            `Bootcamp not found with ID of ${req.params.bootcampID}`,
            404
          )
        );
      }
      query = Course.find({ bootcamp: req.params.bootcampID });
    }
    // Get all courses
    else {
      query = Course.find();
    }

    // Execute query
    const courses = await query;

    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses,
    });
  } catch (e) {
    next(e);
  }
};

module.exports = {
  getCourses,
};

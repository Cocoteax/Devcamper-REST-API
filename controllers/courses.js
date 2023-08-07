const ErrorResponse = require("../utils/errorResponse"); // Custom error response
const Course = require("../models/Course");
const Bootcamp = require("../models/Bootcamp");

// @desc    Get courses (Either all or from a particular bootcamp depending on route), w/ query strings for filtering, selecting, sorting
// @route   GET /api/v1/courses?
// @route   GET /api/v1/bootcamps/:bootcampID/courses?
// @access  PUBLIC
const getCourses = async (req, res, next) => {
  try {
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
      const courses = await Course.find({ bootcamp: req.params.bootcampID });
      res.status(200).json({
        success: true,
        count: courses.length,
        data: courses,
      });
    }
    // Get all courses with pagination, from advanced middleware (See advancedResults.js)
    else {
      res.status(200).json(res.advancedResults);
    }
  } catch (e) {
    next(e);
  }
};

// @desc    Get single course
// @route   GET /api/v1/courses/:id
// @access  PUBLIC
const getSingleCourse = async (req, res, next) => {
  try {
    // .populate() returns the fields of the other model (bootcamps)
    // Pass in a config object continaining the path of the foreign key (bootcamp) within the Course model and select specific fields if needed
    const course = await Course.findById(req.params.id).populate({
      path: "bootcamp",
      select: "name description",
    });

    if (!course) {
      return next(
        new ErrorResponse(`Course not found with ID of ${req.params.id}`, 404)
      );
    }

    res.status(200).json({
      success: true,
      data: course,
    });
  } catch (e) {
    next(e);
  }
};

// @desc    Create single course
// @route   POST /api/v1/bootcamps/:bootcampID/courses
// @access  PRIVATE
const createCourse = async (req, res, next) => {
  try {
    // Add user to req.body through our authentication middlewares which contains req.user
    req.body.user = req.user.id;
    // Extract bootcampID from params to req.body since we don't expect user to put in bootcamp in the POST request
    req.body.bootcamp = req.params.bootcampID;

    // Check if bootcamp exists
    const bootcamp = await Bootcamp.findById(req.params.bootcampID);
    if (!bootcamp) {
      return next(
        new ErrorResponse(`Bootcamp not found with ID of ${req.params.id}`)
      );
    }

    // Ensure user is the bootcamp owner OR has admin role
    if (bootcamp.user.toString() !== req.user.id && req.user.role !== "admin") {
      return next(
        new ErrorResponse(
          `User ${req.user.id} is not authorized to create courses for bootcamp ${bootcamp._id}`,
          401
        )
      );
    }

    const course = await Course.create(req.body);

    res.status(200).json({
      success: true,
      data: course,
    });
  } catch (e) {
    next(e);
  }
};

// @desc    Update single course
// @route   PUT /api/v1/courses/:id
// @access  PRIVATE
const updateCourse = async (req, res, next) => {
  try {
    let course = await Course.findById(req.params.id);
    // Check for valid course
    if (!course) {
      return next(
        new ErrorResponse(`No course with id of ${req.params.id}`),
        404
      );
    }

    // Ensure user is the course owner OR has admin role
    if (course.user.toString() !== req.user.id && req.user.role !== "admin") {
      return next(
        new ErrorResponse(
          `User ${req.user.id} is not authorized to update course ${course._id}`,
          401
        )
      );
    }

    // findByIdAndUpdate accepts 4 parameters: filter, update, options, callback
    course = await Course.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      {
        new: true,
        runValidators: true,
      }
    );

    await course.save() // .save() to activate the getAverageRating pre-hook middleware
    return res.status(200).json({
      success: true,
      data: course,
    });
  } catch (e) {
    next(e);
  }
};

// @desc    Delete single course
// @route   DELETE /api/v1/courses/:id
// @access  PRIVATE
const deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    // Check if valid course
    if (!course) {
      return next(
        new ErrorResponse(`No course with id of ${req.params.id}`),
        404
      );
    }
    // Ensure user is the course owner OR has admin role
    if (course.user.toString() !== req.user.id && req.user.role !== "admin") {
      return next(
        new ErrorResponse(
          `User ${req.user.id} is not authorized to delete course ${course._id}`,
          401
        )
      );
    }
    await course.deleteOne();
    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (e) {
    next(e);
  }
};

module.exports = {
  getCourses,
  getSingleCourse,
  createCourse,
  updateCourse,
  deleteCourse,
};

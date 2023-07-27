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
      // .populate() returns the fields of the other model (bootcamps)
      // Pass in a config object continaining the path of the foreign key (bootcamp) within the Course model and select specific fields if needed
      query = Course.find().populate({
        path: "bootcamp",
        select: "name description",
      });
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

// @desc    Get single course
// @route   GET /api/v1/courses/:id
// @access  PUBLIC
const getSingleCourse = async (req, res, next) => {
  try {
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
    // Extract bootcampID from params to req.body since we don't expect user to put in bootcamp in the POST request
    req.body.bootcamp = req.params.bootcampID;

    // Check if bootcamp exists
    const bootcamps = await Bootcamp.findById(req.params.bootcampID);
    if (!bootcamps) {
      return next(
        new ErrorResponse(`Bootcamp not found with ID of ${req.params.id}`)
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
    // findByIdAndUpdate accepts 4 parameters: filter, update, options, callback
    course = await Course.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      {
        new: true,
        runValidators: true,
      }
    );
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

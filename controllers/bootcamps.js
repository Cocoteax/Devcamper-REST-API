const Bootcamp = require("../models/Bootcamp");
const ErrorResponse = require("../utils/errorResponse"); // Custom error response

// @desc    Get all bootcamps
// @route   GET /api/v1/bootcamps
// @access  PUBLIC
const getAllBootcamps = async (req, res, next) => {
  try {
    const bootcamps = await Bootcamp.find();
    return res.status(200).json({
      success: true,
      count: bootcamps.length,
      data: bootcamps,
    });
  } catch (e) {
    // Pass the error to express (We define a custom middleware (error.js) to handle errors from asynchronous fns)
    // NOTE: This error will be checked and handled on a case-by-case basis as defined in our custom error middleware (error.js)
    next(e);
  }
};

// @desc    Get single bootcamp based on id
// @route   GET /api/v1/bootcamps/:id
// @access  PUBLIC
const getBootcamp = async (req, res, next) => {
  try {
    const bootcampID = req.params.id;
    const bootcamp = await Bootcamp.findById(bootcampID);
    // If no existing bootcamp
    if (!bootcamp) {
      // Pass the error to express (We define a custom middleware (error.js) to handle errors from asynchronous fns)
      // NOTE: Since we passed an instance of ErrorReponse into next(), it will be be used to handle errors in our custom error middleware (error.js)
      return next(
        new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
      );
    }
    return res.status(200).json({
      success: true,
      data: bootcamp,
    });
  } catch (e) {
    // Pass the error to express (We define a custom middleware (error.js) to handle errors from asynchronous fns)
    // NOTE: This error will be checked and handled on a case-by-case basis as defined in our custom error middleware (error.js)
    next(e);
  }
};

// @desc    Create single bootcamp
// @route   POST /api/v1/bootcamps
// @access  Private
const createBootcamp = async (req, res, next) => {
  try {
    const bootcamp = await Bootcamp.create(req.body); // Alternatively, create a new Bootcamp object and .save()
    return res.status(200).json({
      success: true,
      data: bootcamp,
    });
  } catch (e) {
    next(e);
  }
};

// @desc    Update bootcamp based on id
// @route   PUT /api/v1/bootcamps/:id
// @access  Private
const updateBootcamp = async (req, res, next) => {
  try {
    const bootcampID = req.params.id;
    // findByIdAndUpdate accepts 4 parameters: filter, update, options, callback
    const bootcamp = await Bootcamp.findByIdAndUpdate(
      bootcampID,
      { $set: req.body },
      {
        new: true,
        runValidators: true,
      }
    );
    // If no existing bootcamp
    if (!bootcamp) {
      return next(
        new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
      );
    }
    return res.status(200).json({
      success: true,
      data: bootcamp,
    });
  } catch (e) {
    next(e);
  }
};

// @desc    Delete bootcamp based on id
// @route   DELETE /api/v1/bootcamps/:id
// @access  Private
const deleteBootcamp = async (req, res, next) => {
  try {
    const bootcampID = req.params.id;
    const bootcamp = await Bootcamp.findByIdAndDelete(bootcampID);
    // If no existing bootcamp
    if (!bootcamp) {
      return next(
        new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
      );
    }
    return res.status(200).json({
      success: true,
      data: {},
    });
  } catch (e) {
    next(e);
  }
};

module.exports = {
  getAllBootcamps,
  getBootcamp,
  createBootcamp,
  updateBootcamp,
  deleteBootcamp,
};

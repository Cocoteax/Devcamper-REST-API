const Bootcamp = require("../models/Bootcamp");
const geocoder = require("../utils/geocoder");
const ErrorResponse = require("../utils/errorResponse"); // Custom error response
const path = require("path");

// @desc    Get all bootcamps (w/ query strings for filtering, selecting, sorting)
// @route   GET /api/v1/bootcamps/?
// @access  PUBLIC
const getAllBootcamps = async (req, res, next) => {
  try {
    // Since this request will pass through advancedResults middleware first, we can just return res.advancedResults
    // NOTE: res.advancedResults contains all the data required (See advancedResults.js)
    return res.status(200).json(res.advancedResults);
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
      // Pass our custom ErrorReponse class as an error to express (We define a custom middleware (error.js) to handle errors from asynchronous fns)
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
    // Add user to req.body through our authentication middlewares which contains req.user
    req.body.user = req.user.id;

    // Check for published bootcamp
    const publishedBootcamp = await Bootcamp.findOne({ user: req.user.id });

    // If user is not admin, they can only add one bootcamp
    if (publishedBootcamp && req.user.role !== "admin") {
      return next(
        new ErrorResponse(
          `The user with ID ${req.user.id} has already published a bootcamp`,
          400
        )
      );
    }

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
    let bootcamp = await Bootcamp.findById(req.params.id);

    // If no existing bootcamp
    if (!bootcamp) {
      return next(
        new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
      );
    }

    // Ensure user is the bootcamp owner OR has admin role
    if (bootcamp.user.toString() !== req.user.id && req.user.role !== "admin") {
      return next(
        new ErrorResponse(
          `User ${req.user.id} is not authorized to update this bootcamp`,
          401
        )
      );
    }

    // findByIdAndUpdate accepts 4 parameters: filter, update, options, callback
    bootcamp = await Bootcamp.findByIdAndUpdate(
      bootcampID,
      { $set: req.body },
      {
        new: true,
        runValidators: true,
      }
    );
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
    const bootcamp = await Bootcamp.findById(req.params.id);
    // If no existing bootcamp
    if (!bootcamp) {
      return next(
        new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
      );
    }

    // Ensure user is the bootcamp owner OR has admin role
    if (bootcamp.user.toString() !== req.user.id && req.user.role !== "admin") {
      return next(
        new ErrorResponse(
          `User ${req.user.id} is not authorized to delete this bootcamp`,
          401
        )
      );
    }

    // NOTE: By calling .deleteOne() on the document itself and not the query, it triggers the document middleware to remove all bootcamp courses (See Bootcamp.js model)
    bootcamp.deleteOne(); // Remove bootcamp
    return res.status(200).json({
      success: true,
      data: {},
    });
  } catch (e) {
    next(e);
  }
};

// @desc    Get bootcamps within a radius
// @route   GET /api/v1/bootcamps/radius/:zipcode/:distance
// @access  Private
const getBootcampsInRadius = async (req, res, next) => {
  try {
    const { zipcode, distance } = req.params;

    // Get lng/lat from geocoder based on zipcode
    const loc = await geocoder.geocode(zipcode);
    const lng = loc[0].longitude;
    const lat = loc[0].latitude;

    // Calculate radius for searching bootcamps by dividing distance from the radius of Earth (6378 km)
    const radius = distance / 6378;

    // Use $geoWithin and $centerSphere to get all bootcamps within a radius
    // https://www.mongodb.com/docs/manual/reference/operator/query/centerSphere/
    const bootcamps = await Bootcamp.find({
      location: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
    });

    res.status(200).json({
      success: true,
      count: bootcamps.length,
      data: bootcamps,
    });
  } catch (e) {
    next(e);
  }
};

// @desc    Upload photo for bootcamp
// @route   PUT /api/v1/bootcamps/:id/photo
// @access  Private
const bootcampPhotoUpload = async (req, res, next) => {
  try {
    const bootcamp = await Bootcamp.findById(req.params.id);
    // If no existing bootcamp
    if (!bootcamp) {
      return next(
        new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
      );
    }

    // Ensure user is the bootcamp owner OR has admin role
    if (bootcamp.user.toString() !== req.user.id && req.user.role !== "admin") {
      return next(
        new ErrorResponse(
          `User ${req.user.id} is not authorized to upload photos for this bootcamp`,
          401
        )
      );
    }

    // Check if a file has been sent through request using express-fileupload middleware
    if (!req.files) {
      return next(new ErrorResponse(`Please upload a file`, 400));
    }

    const file = req.files.file; // .file is the "name" attribute of the input with type=file

    // Ensure image is a photo
    if (!file.mimetype.startsWith("image")) {
      return next(new ErrorResponse(`Please upload an image file`, 400));
    }

    // Check for valid file size
    if (file.size > process.env.MAX_FILE_UPLOAD_SIZE) {
      return next(
        new ErrorResponse(
          `Please upload a image with size less than ${process.env.MAX_FILE_UPLOAD_SIZE}`,
          400
        )
      );
    }

    // Create custom file name
    file.name = `photo_${bootcamp._id}${path.parse(file.name).ext}`;

    // Save file into local directory using .mv() which is available through express-fileupload
    // NOTE: first arg is path to save, second arg is callback which executes after saving to path
    file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async (e) => {
      if (e) {
        console.log(e);
        return next(new ErrorResponse(`Problem with file upload`, 500));
      }
      // Store file name to mongodb
      await Bootcamp.findByIdAndUpdate(req.params.id, { photo: file.name });
      res.status(200).json({
        success: true,
        data: file.name,
      });
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
  getBootcampsInRadius,
  bootcampPhotoUpload,
};

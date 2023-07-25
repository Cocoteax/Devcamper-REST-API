const Bootcamp = require("../models/Bootcamp");
const geocoder = require("../utils/geocoder");
const ErrorResponse = require("../utils/errorResponse"); // Custom error response
const Course = require("../models/Course");

// @desc    Get all bootcamps (w/ query strings for filtering, selecting, sorting)
// @route   GET /api/v1/bootcamps/?
// @access  PUBLIC
const getAllBootcamps = async (req, res, next) => {
  try {
    let query; // Used to hold the actual mongodb operation

    // Copy req.query
    const reqQuery = { ...req.query };

    // Fields to exclude from reqQuery for special operations
    // E.g.: If we don't exclude "select", then it'll be used as a value for filtering in .find() below
    const removeFields = ["select", "sort", "page", "limit"];
    removeFields.forEach((param) => delete reqQuery[param]);

    // If reqQuery has mongodb operators, then we create mongodb operators by appending $
    let queryStr = JSON.stringify(reqQuery);
    queryStr = queryStr.replace(
      /\b(gt|gte|lt|lte|in)\b/g,
      (match) => `$${match}`
    );

    // Pass req.query object into find() and it'll automatically filter for us
    // NOTE: query is just a promise that hasn't been executed yet => This allows us to chain on other methods if needed before executing query
    // NOTE: we reverse populate courses into bootcamp using virtuals (See Bootcamp.js model)
    query = Bootcamp.find(JSON.parse(queryStr)).populate("courses");

    // Select fields
    if (req.query.select) {
      const fields = req.query.select.split(",").join(" ");
      query = query.select(fields); // Chain on .select() to query to include only required fields
    }

    // Sort fields
    if (req.query.sort) {
      const sortBy = req.query.sort.split(",").join(" ");
      query.sort(sortBy);
    } else {
      // Default sort by creation date and name
      query = query.sort({ createdAt: -1, name: -1 });
    }

    // Set up pagination => page specifies what page to navigate to, limit specifies how many results gets returned
    // E.g.: page=2&limit=30 means each page has 30 resource, and we want to navigate to page 2
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;
    const startIndex = (page - 1) * limit; // Overall index of the starting document in that specified page
    const endIndex = page * limit; // Ending index of document in the specified page
    const total = await Bootcamp.find(JSON.parse(queryStr)).countDocuments();
    query = query.skip(startIndex).limit(limit); // .skip() specifies number of documents to skip, .limit() specifies max number of documents to return

    // Execute query
    const bootcamps = await query;

    // Pagination result
    let pagination = {};
    // If there are still results in next page
    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit: limit,
      };
    }
    // If there is a previous page
    if (page > 1) {
      pagination.prev = {
        page: page - 1,
        limit: limit,
      };
    }

    return res.status(200).json({
      success: true,
      count: bootcamps.length,
      pagination: pagination,
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
    const bootcamp = await Bootcamp.findById(req.params.id);
    // If no existing bootcamp
    if (!bootcamp) {
      return next(
        new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
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

module.exports = {
  getAllBootcamps,
  getBootcamp,
  createBootcamp,
  updateBootcamp,
  deleteBootcamp,
  getBootcampsInRadius,
};

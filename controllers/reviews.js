const ErrorResponse = require("../utils/errorResponse"); // Custom error response
const Review = require("../models/Review");
const Bootcamp = require("../models/Bootcamp");

// @desc    Get reviews (Either all or from a particular bootcamp depending on route), w/ query strings for filtering, selecting, sorting
// @route   GET /api/v1/reviews?
// @route   GET /api/v1/bootcamps/:bootcampID/reviews?
// @access  PUBLIC
const getReviews = async (req, res, next) => {
  try {
    // Get reviews from particular bootcamp
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
      const reviews = await Review.find({ bootcamp: req.params.bootcampID });
      res.status(200).json({
        success: true,
        count: reviews.length,
        data: reviews,
      });
    }
    // Get all reviews with pagination, from advanced middleware (See advancedResults.js)
    else {
      res.status(200).json(res.advancedResults);
    }
  } catch (e) {
    next(e);
  }
};

// @desc    Get single review
// @route   GET /api/v1/reviews/:id
// @access  PUBLIC
const getReview = async (req, res, next) => {
  try {
    // Populate the review document with bootcamp name and description
    const review = await Review.findById(req.params.id).populate({
      path: "bootcamp",
      select: "name description",
    });

    console.log("yes");
    // Check if review is valid
    if (!review) {
      return next(
        new ErrorResponse(`Review with id of ${req.params.id} does not exist`),
        404
      );
    }

    res.status(200).json({
      success: true,
      data: review,
    });
  } catch (e) {
    next(e);
  }
};

// @desc    Create review
// @route   POST /api/v1/bootcamps/:bootcampID/reviews
// @access  PRIVATE
const createReview = async (req, res, next) => {
  try {
    // Manually check if user already reviewed bootcamp
    const existingReview = await Review.findOne({
      bootcamp: req.params.bootcampID,
      user: req.user.id,
    });
    if (existingReview) {
      return next(
        new ErrorResponse(`User already reviewed this bootcamp before`, 400)
      );
    }

    // Add bootcampid and userid into req.body
    req.body.bootcamp = req.params.bootcampID;
    req.body.user = req.user.id; // Access user id via req.user from our protectRoute middleware

    const bootcamp = await Bootcamp.findById(req.params.bootcampID);
    // Check if valid bootcamp
    if (!bootcamp) {
      return next(
        new ErrorResponse(
          `Bootcamp with id of ${req.params.bootcampID} not found`,
          404
        )
      );
    }

    // Create the review
    const review = await Review.create(req.body);
    res.status(201).json({
      success: true,
      data: review,
    });
  } catch (e) {
    next(e);
  }
};

// @desc    Update review
// @route   PUT /api/v1/reviews/:id
// @access  PRIVATE
const updateReview = async (req, res, next) => {
  try {
    // Check for valid review
    let review = await Review.findById(req.params.id);
    if (!review) {
      return next(
        new ErrorResponse(`Review with id of ${req.params.id} not found`, 404)
      );
    }

    // Ensure that review belongs to user OR user is admin
    if (review.user.toString() !== req.user.id && req.user.role !== "admin") {
      return next(
        new ErrorResponse(
          `User ${req.user.id} is not authorized to update this review`
        )
      );
    }

    // Update review
    review = await Review.findByIdAndUpdate(
      req.params.id,
      {
        $set: req.body,
      },
      { new: true, runValidators: true }
    );
    await review.save(); // .save() to activate getAverageRating pre-hook middleware

    res.status(200).json({
      success: true,
      data: review,
    });
  } catch (e) {
    next(e);
  }
};

// @desc    Delete review
// @route   DELETE /api/v1/reviews/:id
// @access  PRIVATE
const deleteReview = async (req, res, next) => {
  try {
    // Check for valid review
    let review = await Review.findById(req.params.id);
    if (!review) {
      return next(
        new ErrorResponse(`Review with id of ${req.params.id} not found`, 404)
      );
    }

    // Ensure that review belongs to user OR user is admin
    if (review.user.toString() !== req.user.id && req.user.role !== "admin") {
      return next(
        new ErrorResponse(
          `User ${req.user.id} is not authorized to update this review`
        )
      );
    }

    await review.deleteOne();
    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (e) {
    next(e);
  }
};

module.exports = {
  getReviews,
  getReview,
  createReview,
  updateReview,
  deleteReview,
};

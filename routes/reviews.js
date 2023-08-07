const express = require("express");
const router = express.Router({ mergeParams: true }); // Set meregParams to allow rerouting from bootcamp router to review router

const reviewController = require("../controllers/reviews");
const advancedResults = require("../middleware/advancedResults");
const { protectRoute, authorizeRoles } = require("../middleware/auth");
const Review = require("../models/Review");

// /api/v1/reviews
// /api/v1/bootcamp/:bootcampID/reviews
// NOTE: route depends on where the request gets routed from, either server.js or bootcamps.js controller (re-routing)
router
  .route("/")
  .get(
    advancedResults(Review, { path: "bootcamp", select: "name" }),
    reviewController.getReviews
  )
  .post(
    protectRoute,
    authorizeRoles("user", "admin"),
    reviewController.createReview
  );

// /api/v1/reviews/:id
router
  .route("/:id")
  .get(reviewController.getReview)
  .put(
    protectRoute,
    authorizeRoles("user", "admin"),
    reviewController.updateReview
  )
  .delete(
    protectRoute,
    authorizeRoles("user", "admin"),
    reviewController.deleteReview
  );

module.exports = router;

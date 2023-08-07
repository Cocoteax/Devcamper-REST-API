const express = require("express");
const router = express.Router();

const adminController = require("../controllers/adminUser");
const advancedResults = require("../middleware/advancedResults");
const { protectRoute, authorizeRoles } = require("../middleware/auth");
const User = require("../models/User");

// Every adminUser route must pass through these 2 middlewares first, in-order
router.use(protectRoute);
router.use(authorizeRoles("admin"));

// /api/v1/admin
router
  .route("/")
  .get(advancedResults(User), adminController.getUsers)
  .post(adminController.createUser);

// /api/v1/admin/:id
router
  .route("/:id")
  .get(adminController.getUser)
  .put(adminController.updateUser)
  .delete(adminController.deleteUser);

module.exports = router;

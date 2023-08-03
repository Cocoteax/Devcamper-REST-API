const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth");
const { protectRoute } = require("../middleware/auth");

// /api/v1/auth/register
router.route("/register").post(authController.registerUser);

// /api/v1/auth/login
router.route("/login").post(authController.loginUser);

// /api/v1/auth/me
router.route("/me").get(protectRoute, authController.getCurrentUser);

module.exports = router;

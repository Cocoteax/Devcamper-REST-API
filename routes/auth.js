const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth");

// /api/v1/auth/register
router.route("/register").post(authController.registerUser);

module.exports = router

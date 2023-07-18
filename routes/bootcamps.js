const express = require("express");
const router = express.Router();

const bootcampController = require("../controllers/bootcamps");

// ========== Neat way of specifying routes by grouping them up based on endpoints ========== //

// /api/v1/bootcamps => GET, POST
router
  .route("/")
  .get(bootcampController.getAllBootcamps)
  .post(bootcampController.createBootcamp);

// /api/v1/bootcamps/:id => GET, PUT, DELETE
router
  .route("/:id")
  .get(bootcampController.getBootcamp)
  .put(bootcampController.updateBootcamp)
  .delete(bootcampController.deleteBootcamp);

// ========== Alternative syntax to specify routes one by one ========== //

// // /api/v1/bootcamps => GET
// router.get("/", bootcampController.getAllBootcamps);

// // /api/v1/bootcamps/:id => GET
// router.get("/:id", bootcampController.getBootcamp);

// // /api/v1/bootcamps => POST
// router.post("/", bootcampController.createBootcamp);

// // /api/v1/bootcamps => PUT
// router.put("/:id", bootcampController.updateBootcamp);

// // /api/v1/bootcamps => DELETE
// router.delete("/:id", bootcampController.deleteBootcamp);

module.exports = { router };

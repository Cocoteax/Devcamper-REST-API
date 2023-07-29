const express = require("express");
const router = express.Router();

const bootcampController = require("../controllers/bootcamps");

// Include other resource routers
const courseRouter = require("./courses");

// ========== Re-route to other resource routers ==========

// /api/v1/bootcamps/:bootcampID/courses will be re-routed to courseRouter
router.use("/:bootcampID/courses", courseRouter);

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

// /api/v1/bootcamps/radius/:zipcode/:distance
router
  .route("/radius/:zipcode/:distance")
  .get(bootcampController.getBootcampsInRadius);

// /api/v1/bootcamps/:id/photo
router.route("/:id/photo").put(bootcampController.bootcampPhotoUpload);

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

module.exports = router;

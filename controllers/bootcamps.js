// @desc    Get all bootcamps
// @route   GET /api/v1/bootcamps
// @access  PUBLIC
const getAllBootcamps = async (req, res, next) => {
  return res.status(200).json({
    success: true,
    message: "Get all bootcamps",
  });
};

// @desc    Get single bootcamp based on id
// @route   GET /api/v1/bootcamps/:id
// @access  PUBLIC
const getBootcamp = async (req, res, next) => {
  return res.status(200).json({
    success: true,
    message: `Get bootcamp ${req.params.id}`,
  });
};

// @desc    Create single bootcamp
// @route   POST /api/v1/bootcamps
// @access  Private
const createBootcamp = async (req, res, next) => {
  return res.status(200).json({
    success: true,
    message: `Create new bootcamp`,
  });
};

// @desc    Update bootcamp based on id
// @route   PUT /api/v1/bootcamps/:id
// @access  Private
const updateBootcamp = async (req, res, next) => {
  return res.status(200).json({
    success: true,
    message: `Update bootcamp ${req.params.id}`,
  });
};

// @desc    Delete bootcamp based on id
// @route   DELETE /api/v1/bootcamps/:id
// @access  Private
const deleteBootcamp = async (req, res, next) => {
  return res.status(200).json({
    success: true,
    message: `Delete bootcamp ${req.params.id}`,
  });
};

module.exports = {
  getAllBootcamps,
  getBootcamp,
  createBootcamp,
  updateBootcamp,
  deleteBootcamp,
};

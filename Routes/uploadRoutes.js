const express = require("express");
const router = express.Router();
const { uploadSingle, uploadMultiple } = require("../Middlewares/Multer");
const { uploadSingleImage, uploadMultipleImages } = require("../Controllers/uploadController");

// Single image upload
router.post("/upload/single", uploadSingle, uploadSingleImage);

// Multiple images upload
router.post("/upload/multiple", uploadMultiple, uploadMultipleImages);

module.exports = router;
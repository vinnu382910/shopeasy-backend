// controllers/uploadController.js
const imageService = require('../services/imageService');

const uploadSingleImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    const result = await imageService.uploadSingle(req.file.buffer, req.file.mimetype);
    
    res.status(200).json({
      message: "Image uploaded successfully",
      imageUrl: result.secure_url
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ 
      message: "Failed to upload image",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

const uploadMultipleImages = async (req, res) => {
  try {
    if (!req.files?.length) {
      return res.status(400).json({ message: "No images provided" });
    }

    const results = await imageService.uploadMultiple(req.files);
    const imageUrls = results.map(r => r.secure_url);

    res.status(200).json({
      message: "Images uploaded successfully",
      imageUrls,
      count: imageUrls.length
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ 
      message: "Failed to upload images",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

module.exports = { uploadSingleImage, uploadMultipleImages };
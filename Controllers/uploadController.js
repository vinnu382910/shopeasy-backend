const cloudinary = require("../Config/cloudinary");

const uploadSingleImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    const fileStr = req.file.buffer.toString("base64");
    const uploadedResponse = await cloudinary.uploader.upload(
      `data:${req.file.mimetype};base64,${fileStr}`,
      {
        folder: "products",
        format: "webp",
      }
    );

    res.status(200).json({
      message: "Image uploaded successfully",
      imageUrl: uploadedResponse.secure_url,
    });
  } catch (err) {
    console.error("Cloudinary Upload Error:", err);
    res.status(500).json({ 
      message: "Failed to upload image",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

const uploadMultipleImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No images provided" });
    }

    const uploadPromises = req.files.map(file => {
      const fileStr = file.buffer.toString("base64");
      return cloudinary.uploader.upload(
        `data:${file.mimetype};base64,${fileStr}`,
        {
          folder: "products",
          format: "webp",
        }
      );
    });

    const results = await Promise.all(uploadPromises);
    const imageUrls = results.map(result => result.secure_url);

    res.status(200).json({
      message: "Images uploaded successfully",
      imageUrls,
      count: imageUrls.length
    });
  } catch (err) {
    console.error("Cloudinary Upload Error:", err);
    res.status(500).json({ 
      message: "Failed to upload images",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

module.exports = { 
  uploadSingleImage, 
  uploadMultipleImages 
};
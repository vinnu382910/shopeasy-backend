// services/imageService.js
const cloudinary = require('../Config/cloudinary');

const extractPublicId = (url) => {
  try {
    if (!url) return null;
    
    // Remove the file extension and any version prefix
    const baseUrl = url.split('/').slice(-2).join('/'); // Get last two parts
    const publicId = baseUrl.replace(/\.[^/.]+$/, ""); // Remove extension
    
    // If the URL contains transformations, we need to extract differently
    if (url.includes('/image/upload/')) {
      const parts = url.split('/image/upload/')[1].split('/');
      const versionAndPath = parts.slice(1).join('/');
      return versionAndPath.replace(/\.[^/.]+$/, "");
    }
    
    return publicId;
  } catch (err) {
    console.error('Error extracting public ID:', err);
    return null;
  }
};

const uploadSingle = async (fileBuffer, mimeType) => {
  const fileStr = fileBuffer.toString("base64");
  return cloudinary.uploader.upload(
    `data:${mimeType};base64,${fileStr}`,
    { 
      folder: "products", 
      format: "webp",
      resource_type: "image" 
    }
  );
};

const uploadMultiple = async (files) => {
  return Promise.all(files.map(file => 
    uploadSingle(file.buffer, file.mimetype)
  ));
};

const deleteImage = async (imageUrl) => {
  try {
    const publicId = extractPublicId(imageUrl);
    if (!publicId) {
      console.warn('No public ID found for URL:', imageUrl);
      return null;
    }
    
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'image'
    });
    return result;
  } catch (err) {
    console.error('Error deleting image:', err);
    throw err;
  }
};

const deleteMultiple = async (imageUrls) => {
  try {
    const deletePromises = imageUrls.map(url => deleteImage(url));
    return Promise.all(deletePromises);
  } catch (err) {
    console.error('Error in batch deletion:', err);
    throw err;
  }
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  deleteImage,
  deleteMultiple,
  extractPublicId // Export for testing if needed
};
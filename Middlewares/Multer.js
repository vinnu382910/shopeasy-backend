const multer = require('multer');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Only images are allowed'), false);
  }
};

const limits = {
  fileSize: 5 * 1024 * 1024, // 5MB per file
  files: 5 // Maximum 5 files at once
};

const upload = multer({ 
  storage, 
  fileFilter, 
  limits 
});

// Create separate middleware instances
const uploadSingle = upload.single('image');
const uploadMultiple = upload.array('images', 5); // Max 5 images

module.exports = {
  uploadSingle,
  uploadMultiple
};
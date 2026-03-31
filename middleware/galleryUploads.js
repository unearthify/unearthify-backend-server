const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure the 'uploadsGallery' directory exists asynchronously
const dir = path.join(__dirname, '..', 'galleryImage');  // Adjust to point to the server root
fs.promises.mkdir(dir, { recursive: true }).catch((err) => {
  console.error("Error creating uploads directory:", err);
});

// Set storage engine for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, dir); // Use the updated directory path
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename with timestamp
  },
});

// Filter file type (allow only images)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true); // Allow image files
  } else {
    const error = new Error("Only image files are allowed");
    error.code = "INVALID_FILE_TYPE";
    cb(error, false); // Reject non-image files with an error
  }
};

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
});

// Export the upload middleware
module.exports = upload;

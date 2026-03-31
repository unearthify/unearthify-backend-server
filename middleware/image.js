const multer = require("multer");
const path = require("path");

// Set up storage engine for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "familyImage/"); // Store images in the 'familyImage' folder
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
  }
});

// Filter allowed image types (only images)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true); // Accept image file
  } else {
    cb(new Error("Only image files are allowed"), false); // Reject non-image files
  }
};

// Set file size limit to 10 MB (10 * 1024 * 1024 bytes)
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // Set max file size to 10 MB
  },
}).single("image"); // Handle single file upload with the field name "image"
module.exports = upload;
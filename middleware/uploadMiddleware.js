const multer = require("multer");
const path = require("path");

// Storage configuration for artist images
const artistStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploadArtistImage/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      "artist-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

// Storage configuration for event images
const eventStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "eventImage/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      "event-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

// Storage configuration for art form images
const artFormStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "artFormImage/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      "artform-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

// Storage configuration for gallery images
const galleryStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "galleryImage/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      "gallery-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

// File filter to accept only images
const imageFileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Only image files are allowed (jpeg, jpg, png, gif, webp)"));
  }
};

// Upload middleware instances
const uploadArtistImage = multer({
  storage: artistStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

const uploadEventImage = multer({
  storage: eventStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

const uploadArtFormImage = multer({
  storage: artFormStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

const uploadGalleryImage = multer({
  storage: galleryStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

module.exports = {
  uploadArtistImage,
  uploadEventImage,
  uploadArtFormImage,
  uploadGalleryImage,
};

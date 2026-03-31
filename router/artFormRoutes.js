const express = require("express");
const router = express.Router();
const { protectRoute, restrictTo } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");
const uploadToCloudinary = require("../middleware/cloudinaryUpload")
// Import New Controllers
const {
  createCategory,
  getAllCategories,
  getCategoryById,
  deleteCategory,
  updateArtTypeInCategory ,
  deleteArtType,
  addArtTypeToCategory,
  updateCategory
} = require("../controller/artform/artCategoryController");

const {
  createArtDetail,
  getAllArtDetails,
  getArtDetailById,
  updateArtDetail,  
  deleteArtDetail
} = require("../controller/artform/artDetailController");


// ==========================================
// Category Routes
// ==========================================

// Public: Get all categories (Admin likely needs this too for lists, and User for viewing)
router.get("/categories", getAllCategories);
router.get("/categories/:id", getCategoryById);

// Admin: Create Category with Art Types
// Expects 'images' field for files
router.post(
  "/categories",
  protectRoute,
  restrictTo("admin"), // Uncomment protecting later if needed, user didn't specify authentication reqs but usually yes.
  upload.fields([
    { name: "categoryImage", maxCount: 1 },
    { name: "image", maxCount: 20 }
  ]), // "image" matches the Postman key (can handle multiple files with same key)
  createCategory
);

router.delete(
  "/categories/:id",
  protectRoute,
  restrictTo("admin"),
  deleteCategory
);

router.put(
  "/categories/:categoryId/arttype/:artTypeId",
  protectRoute,
  restrictTo("admin"),
  upload.fields([{ name: "image", maxCount: 1 }]),
  updateArtTypeInCategory
);

router.delete(
  "/categories/:categoryId/arttype/:artTypeId",
  protectRoute,
  restrictTo("admin"),
  deleteArtType
);

router.post(
  "/categories/:categoryId/arttype",
  protectRoute,
  restrictTo("admin"),
  upload.array("image", 20),
  addArtTypeToCategory
);

// ==========================================
// Art Details Routes
// ==========================================

// Public: Get all details
router.get("/details", getAllArtDetails);
router.get("/details/:id", getArtDetailById);

// Admin: Create Art Details
router.post(
  "/details",
  protectRoute,
  restrictTo("admin"),
  upload.none(), // Required to parse multipart/form-data when no files are uploaded
  createArtDetail
);

router.put(
  "/details/:id",
  protectRoute,
  restrictTo("admin"),
  upload.none(),
  updateArtDetail
);

router.delete(
  "/details/:id",
  protectRoute,
  restrictTo("admin"),
  deleteArtDetail
);

router.put(
  "/categories/:id",
  protectRoute,
  restrictTo("admin"),
  upload.fields([{ name: "categoryImage", maxCount: 1 }]),
  updateCategory
);

module.exports = router;

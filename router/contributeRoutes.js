const express = require("express");
const router = express.Router();
const {
  createContribution,
  getAllContributions,
  deleteContribution,
  updateContribution,
} = require("../controller/contributeController");
const { protectRoute, restrictTo } = require("../middleware/authMiddleware");

const multer = require("multer");
const upload = multer();

// Public route for submitting information
router.post("/contribute", upload.none(), createContribution);

// Admin routes for managing submissions
router.get("/contributions", protectRoute, restrictTo("admin"), getAllContributions);

router.patch(
  "/contributions/:id",
  protectRoute,
  restrictTo("admin"),
  updateContribution
);

router.delete(
  "/contributions/:id",
  protectRoute,
  restrictTo("admin"),
  deleteContribution
);

module.exports = router;

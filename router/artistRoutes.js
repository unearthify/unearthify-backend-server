const express = require("express");
const router = express.Router();

const {
  getAllArtists,
  getFeaturedArtists,
  getArtistById,
  createArtist,
  updateArtistById,
  softDeleteArtist,
  recoverArtist,
  permanentDeleteArtist,
  recoverArtistToPending,
  bulkCreateArtists,
  toggleFeaturedStatus,
} = require("../controller/artistController");

const { protectRoute, restrictTo } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

/**
 * Public Routes
 */

// Get all artists
router.get("/artists", getAllArtists);

// Get featured artists
router.get("/artists/featured", getFeaturedArtists);

// Get artist by ID
router.get("/artists/:id", getArtistById);

router.post(
  "/artists/bulk",
  protectRoute,
  restrictTo("admin"),
  upload.fields([{ name: "image", maxCount: 1 }]),
  bulkCreateArtists
);

router.post(
  "/artists",
  protectRoute,
  restrictTo("admin"),
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "collection", maxCount: 10 },
  ]),
  createArtist
);

// Update artist
router.put(
  "/artists/:id",
  protectRoute,
  restrictTo("admin"),
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "collection", maxCount: 10 },
  ]),
  updateArtistById
);

// soft delete
router.patch(
  "/artists/:id/delete",
  protectRoute,
  restrictTo("admin"),
  softDeleteArtist
);

// recover
router.patch(
  "/artists/:id/recover",
  protectRoute,
  restrictTo("admin"),
  recoverArtist
);

// permanent delete
router.delete(
  "/artists/:id/permanent",
  protectRoute,
  restrictTo("admin"),
  permanentDeleteArtist
);

router.patch(
  "/artists/:id/recover-to-pending",
  protectRoute,
  restrictTo("admin"),
  recoverArtistToPending
);

// Toggle featured status
router.patch("/artists/:id/toggle-featured",protectRoute,restrictTo("admin"),toggleFeaturedStatus);

module.exports = router;

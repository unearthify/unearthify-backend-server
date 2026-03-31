const express = require("express");
const router = express.Router();
const {
  createSubmission,
  createBulkSubmissions,
  getAllSubmissions,
  approveSubmission,
  rejectSubmission,
  deleteSubmission,
  createAdminSubmission,
  getDeletedSubmissions,
  recoverSubmission,
  permanentDeleteSubmission,
  getMySubmissions,
  updateSubmission, // ← add this
} = require("../controller/submissionController");

const { protectRoute, restrictTo } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

// ── Static routes FIRST (before any /:id routes) ──

router.get(
  "/artist-submissions/my",
  protectRoute,
  getMySubmissions
);

router.get(
  "/artist-submissions/deleted",
  protectRoute,
  restrictTo("admin"),
  getDeletedSubmissions
);

router.post(
  "/artist-submissions/bulk",
  upload.fields([{ name: "image", maxCount: 20 }]),
  createBulkSubmissions
);

router.post(
  "/artist-submissions/admin",
  protectRoute,
  restrictTo("admin"),
  upload.fields([{ name: "image", maxCount: 1 }]),
  createAdminSubmission
);

router.get(
  "/artist-submissions",
  protectRoute,
  restrictTo("admin"),
  getAllSubmissions
);

router.post(
  "/artist-submissions",
  protectRoute,
  upload.fields([{ name: "image", maxCount: 1 }]),
  createSubmission
);

// ── Dynamic /:id routes AFTER ──

router.patch(
  "/artist-submissions/:id/approve",
  protectRoute,
  restrictTo("admin"),
  approveSubmission
);

router.patch(
  "/artist-submissions/:id/reject",
  protectRoute,
  restrictTo("admin"),
  rejectSubmission
);

router.patch(
  "/artist-submissions/:id/soft-delete",
  protectRoute,
  restrictTo("admin"),
  deleteSubmission
);

router.patch(
  "/artist-submissions/:id/recover",
  protectRoute,
  restrictTo("admin"),
  recoverSubmission
);

router.patch(
  "/artist-submissions/:id/update",  // ← add this
  protectRoute,
  upload.fields([{ name: "image", maxCount: 1 }]),
  updateSubmission
);

router.delete(
  "/artist-submissions/:id/permanent",
  protectRoute,
  restrictTo("admin", "artist"),
  permanentDeleteSubmission
);

module.exports = router;
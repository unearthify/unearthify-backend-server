const express = require("express");
const router = express.Router();
const {
  getAllEventSubmissions,
  getMyEventSubmissions,
  createEventSubmission,
  createAdminEventSubmission,
  approveEvent,
  rejectEvent,
  deleteEventSubmission,
  updateEventSubmission,
  getDeletedEventSubmissions,
  recoverEventSubmission,
  permanentDeleteEventSubmission,
} = require("../controller/eventSubmissionController");

const { protectRoute, restrictTo } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

// ── Static routes FIRST ──
router.get(
  "/event-submissions/my",
  protectRoute,
  getMyEventSubmissions
);

router.get(
  "/event-submissions/deleted",
  protectRoute,
  restrictTo("admin"),
  getDeletedEventSubmissions
);

router.post(
  "/event-submissions/admin",
  protectRoute,
  restrictTo("admin"),
  upload.single("image"),
  createAdminEventSubmission
);

router.get(
  "/event-submissions/all",
  protectRoute,
  restrictTo("admin"),
  getAllEventSubmissions
);

router.post(
  "/event-submissions",
  protectRoute,
  upload.single("image"),
  createEventSubmission
);

router.get(
  "/event-submissions",
  protectRoute,
  getMyEventSubmissions
);

// ── Dynamic /:id routes AFTER ──
router.patch(
  "/event-submissions/:id/approve",
  protectRoute,
  restrictTo("admin"),
  approveEvent
);

router.patch(
  "/event-submissions/:id/reject",
  protectRoute,
  restrictTo("admin"),
  rejectEvent
);

router.patch(
  "/event-submissions/:id/soft-delete",
  protectRoute,
  restrictTo("admin"),
  deleteEventSubmission
);

router.patch(
  "/event-submissions/:id/update",
  protectRoute,
  upload.single("image"),
  updateEventSubmission
);

router.patch(
  "/event-submissions/:id/recover",
  protectRoute,
  restrictTo("admin"),
  recoverEventSubmission
);

router.delete(
  "/event-submissions/:id/permanent",
  protectRoute,
  restrictTo("admin", "artist"),
  permanentDeleteEventSubmission
);

module.exports = router;
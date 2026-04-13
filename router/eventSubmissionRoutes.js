const express = require("express");
const router = express.Router();
const { protectRoute, restrictTo } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

const {
  createSubmission,
  getAllSubmissions,
  approveSubmission,
  rejectSubmission,
  deleteSubmission,
  getDeletedSubmissions,
  recoverSubmission,
  permanentDeleteSubmission,
  getMySubmissions,
  updateSubmission,
  remindSubmission,
  createBulkEventSubmissions
} = require("../controller/eventSubmissionController");

// Static routes first
router.get("/event-submissions/my", protectRoute, getMySubmissions);
router.get("/event-submissions/deleted", protectRoute, restrictTo("admin"), getDeletedSubmissions);
router.get("/event-submissions/all", protectRoute, restrictTo("admin"), getAllSubmissions);
router.post("/event-submissions", protectRoute, upload.single("image"), createSubmission);

// Dynamic /:id routes after
router.patch("/event-submissions/:id/approve", protectRoute, restrictTo("admin"), approveSubmission);
router.patch("/event-submissions/:id/reject", protectRoute, restrictTo("admin"), rejectSubmission);
router.patch("/event-submissions/:id/soft-delete", protectRoute, restrictTo("admin"), deleteSubmission);
router.patch("/event-submissions/:id/update", protectRoute, upload.single("image"), updateSubmission);
router.patch("/event-submissions/:id/recover", protectRoute, restrictTo("admin"), recoverSubmission);
router.delete("/event-submissions/:id/permanent", protectRoute, restrictTo("admin", "artist"), permanentDeleteSubmission);

router.post(
  "/event-submissions/:id/remind",
  protectRoute,
  remindSubmission
);

router.post(
  "/event-submissions/bulk",
  upload.fields([{ name: "image", maxCount: 10 }]),
  createBulkEventSubmissions
);

module.exports = router;
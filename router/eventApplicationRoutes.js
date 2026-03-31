const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer();


const {
  createEventApplication,
  getAllEventApplications,
  getEventApplicationById,
  updateEventApplicationStatus,
  deleteEventApplication,
} = require("../controller/EventApplicationController");

// Use the exact route structure requested
// POST /api/applications - Submit a new application
router.post("/eventApplications", upload.none(), createEventApplication);

// GET /api/applications - Get all applications (Admin)
router.get("/eventApplications", getAllEventApplications);

// GET /api/applications/:id - Get a single application details
router.get("/eventApplications/:id", getEventApplicationById);

// PUT /api/applications/:id/status - Update application status (Admin)
router.put("/eventApplications/:id/status", updateEventApplicationStatus);

// DELETE /api/applications/:id - Delete an application (Admin)
router.delete("/eventApplications/:id", deleteEventApplication);

module.exports = router;

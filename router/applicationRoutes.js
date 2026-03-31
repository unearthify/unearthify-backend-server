const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer();


const {
  createApplication,
  getAllApplications,
  getApplicationById,
  updateApplicationStatus,
  deleteApplication,
} = require("../controller/applicationController");

// Use the exact route structure requested
// POST /api/applications - Submit a new application
router.post("/applications", upload.none(), createApplication);

// GET /api/applications - Get all applications (Admin)
router.get("/applications", getAllApplications);

// GET /api/applications/:id - Get a single application details
router.get("/applications/:id", getApplicationById);

// PUT /api/applications/:id/status - Update application status (Admin)
router.put("/applications/:id/status", updateApplicationStatus);

// DELETE /api/applications/:id - Delete an application (Admin)
router.delete("/applications/:id", deleteApplication);

module.exports = router;

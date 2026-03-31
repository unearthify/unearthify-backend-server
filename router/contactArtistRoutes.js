const express = require("express");
const router = express.Router();

const { protectRoute, restrictTo } = require("../middleware/authMiddleware");

const {
  getContactRequests,
  createContactArtist,
  deleteContactRequest,
} = require("../controller/ContactArtistController");

// POST → create contact
router.post("/contact-artist", createContactArtist);
// GET → get contact requests
router.get("/contact-artists", protectRoute, restrictTo("admin"), getContactRequests);

// route
router.delete("/contact-artists/:id", protectRoute, restrictTo("admin"), deleteContactRequest);

module.exports = router;
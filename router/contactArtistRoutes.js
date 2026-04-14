const express = require("express");
const router = express.Router();

const { protectRoute, restrictTo } = require("../middleware/authMiddleware");

const {
  getContactRequests,
  createContactArtist,
  deleteContactRequest,
  getMyContactRequests,
} = require("../controller/ContactArtistController");

// POST → create contact
router.post("/contact-artist", createContactArtist);

// GET → get contact requests
router.get("/contact-artists", protectRoute, restrictTo("admin"), getContactRequests);

// GET → logged-in artist gets only their own contact requests
router.get("/contact-requests/my-requests", protectRoute, getMyContactRequests); 

// route
router.delete("/contact-artists/:id", protectRoute, restrictTo("admin", "artist"), deleteContactRequest);

module.exports = router;
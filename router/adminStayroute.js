const express = require("express");
const router = express.Router();
const {
  createEventConnect,
  getEventConnects,
  getEventConnectById,
  updateEventConnect,
  deleteEventConnect,
  getEventItemById,
  updateEventItem,
  deleteEventItem,
} = require("../controller/BannerController");

// Create a new EventConnect
router.post("/eventconnect", createEventConnect);

// Get all EventConnect documents
router.get("/eventconnects", getEventConnects);

// Get a single EventConnect document by ID
router.get("/eventconnect/:id", getEventConnectById);

// Update an EventConnect document by ID
router.put("/eventconnect/:id", updateEventConnect);

// Delete an EventConnect document by ID
router.delete("/eventconnect/:id", deleteEventConnect);

// Get a specific item by Item ID within an EventConnect
router.get("/eventconnect/:id/item/:itemId", getEventItemById);

// Update a specific item by Item ID within an EventConnect
router.put("/eventconnect/:id/item/:itemId", updateEventItem);

// Delete a specific item by Item ID within an EventConnect
router.delete("/eventconnect/:id/item/:itemId", deleteEventItem);

module.exports = router;

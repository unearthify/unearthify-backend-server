const Event = require("../model/Event");
const EventSubmission = require("../model/EventSubmission");
const cloudinary = require("../config/cloudinary");
const uploadToCloudinary = require("../middleware/cloudinaryUpload");
const mongoose = require("mongoose");

const DEFAULT_EVENT_IMAGE = {
  secure_url: "https://res.cloudinary.com/ddni4sjyo/image/upload/v1770180830/default%20image/person_kjmhx8.jpg",
  public_id: null,
};

// GET ALL
const getAllEvents = async (req, res) => {
  try {
    const { deleted } = req.query;

    let filter;
    if (deleted === "true") {
      filter = { isDeleted: true };
    } else {
      filter = {
        $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
      };
    }

    const events = await Event.find(filter).sort({ createdAt: -1 });
    res.json({ data: events });
  } catch (error) {
    res.status(500).json({ message: "Error fetching events", error: error.message });
  }
};

// GET UPCOMING
const getUpcomingEvents = async (req, res) => {
  try {
    const events = await Event.find({
      isDeleted: { $ne: true },
      date: { $gte: new Date() },
    }).sort({ date: 1 });
    res.json({ data: events });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET BY ID
const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.json({ data: event });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// CREATE — admin direct, only Event collection
const createEvent = async (req, res) => {
  try {
    const {
      title, description, date, location,
      categories, recurrence, visibleFrom,
    } = req.body;

    if (!title || !description || !date || !location || !categories) {
      return res.status(400).json({ message: "All fields are required" });
    }

    let mainImg = DEFAULT_EVENT_IMAGE;
    if (req.file) {
      mainImg = await uploadToCloudinary(req.file.buffer, "events");
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const newEvent = new Event({
      title, description, date, location, categories,
      recurrence: recurrence || "none",
      visibleFrom: recurrence === "none" ? today : new Date(visibleFrom),
      image: mainImg.secure_url,
      imageId: mainImg.public_id,
      isDeleted: false,
      // no createdFromSubmission — marks this as admin-direct
    });

    await newEvent.save();
    res.status(201).json({ message: "Event created", data: newEvent });
  } catch (error) {
    console.error("CREATE EVENT ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// UPDATE
const updateEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title, description, date, location,
      categories, recurrence, visibleFrom,
    } = req.body;

    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (title) event.title = title;
    if (description) event.description = description;
    if (date) event.date = date;
    if (location) event.location = location;
    if (categories) event.categories = categories;
    if (recurrence) {
      event.recurrence = recurrence;
      event.visibleFrom = recurrence === "none" ? new Date() : new Date(visibleFrom);
    }

    if (req.file) {
      if (event.imageId) {
        try { await cloudinary.uploader.destroy(event.imageId); } catch (e) {}
      }
      const imgRes = await uploadToCloudinary(req.file.buffer, "events");
      event.image = imgRes.secure_url;
      event.imageId = imgRes.public_id;
    }

    await event.save();

    res.json({ message: "Event updated successfully", data: event });
  } catch (error) {
    res.status(500).json({ message: "Error updating event", error: error.message });
  }
};

// SOFT DELETE — mirrors softDeleteArtist
const softDeleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    event.isDeleted = true;
    event.deletedAt = new Date();
    await event.save();

    res.json({ message: "Event moved to deleted list" });
  } catch (error) {
    console.error("SOFT DELETE ERROR:", error);
    res.status(500).json({ message: "Soft delete failed", error: error.message });
  }
};

const recoverEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    // Create fresh EventSubmission in pending state
    const submission = await EventSubmission.create({
      title: event.title,
      description: event.description,
      date: event.date,
      location: event.location,
      categories: event.categories,
      recurrence: event.recurrence,
      visibleFrom: event.visibleFrom,
      image: event.image,
      imageId: event.imageId,
      status: "pending",
      isDeleted: false,
    });

    if (!submission?._id) {
      throw new Error("Submission creation failed");
    }

    // ALWAYS remove event — same as recoverArtist deleting Artist
    await Event.findByIdAndDelete(id);

    res.json({ message: "Event moved to pending section" });
  } catch (error) {
    console.error("RECOVER EVENT ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// PERMANENT DELETE — mirrors permanentDeleteArtist
const permanentDeleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    // Delete cloudinary image
    if (event.imageId) {
      try { await cloudinary.uploader.destroy(event.imageId); } catch (e) {}
    }

    // Delete linked EventSubmission if exists
    const submission = await EventSubmission.findOne({ approvedEventId: event._id });
    if (submission) {
      if (submission.imageId) {
        try { await cloudinary.uploader.destroy(submission.imageId); } catch (e) {}
      }
      await EventSubmission.findByIdAndDelete(submission._id);
    }

    await Event.findByIdAndDelete(req.params.id);

    res.json({ message: "Event permanently deleted" });
  } catch (err) {
    res.status(500).json({ message: "Permanent delete failed", error: err.message });
  }
};

module.exports = {
  getAllEvents,
  getUpcomingEvents,
  getEventById,
  createEvent,
  updateEventById,
  softDeleteEvent,
  recoverEvent,
  permanentDeleteEvent,
};
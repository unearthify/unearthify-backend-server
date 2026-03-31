const Event = require("../model/Event");
const EventSubmission = require("../model/EventSubmission");
const cloudinary = require("../config/cloudinary");
const uploadToCloudinary = require("../middleware/cloudinaryUpload");
const rollRecurringEvent = require("../utils/rollRecurringEvent");

const DEFAULT_EVENT_IMAGE = {
  secure_url: "https://res.cloudinary.com/ddni4sjyo/image/upload/v1770180830/default%20image/person_kjmhx8.jpg",
  public_id: null,
};

// GET ALL
const getAllEvents = async (req, res) => {
  try {
    const { deleted } = req.query;

    const filter = deleted === "true"
      ? { isDeleted: true }
      : { $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }] };

    const events = await Event.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: events });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET UPCOMING
const getUpcomingEvents = async (req, res) => {
  try {
    const events = await Event.find({
      isDeleted: { $ne: true },
      date: { $gte: new Date() },
    }).sort({ date: 1 });
    res.json({ success: true, data: events });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET BY ID
const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });
    res.json({ success: true, data: event });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// CREATE — admin direct
const createEvent = async (req, res) => {
  try {
    const { title, date, location, description, categories, recurrence, visibleFrom } = req.body;

    if (!title || !date || !location) {
      return res.status(400).json({ message: "title, date, location are required" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Event image is required" });
    }

    if (recurrence && !["none", "monthly", "yearly"].includes(recurrence)) {
      return res.status(400).json({ message: "Invalid recurrence type" });
    }

    const imgRes = await uploadToCloudinary(req.file.buffer, "events");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const newEvent = new Event({
      title, date, location, description, categories,
      image: imgRes.secure_url,
      imageId: imgRes.public_id,
      recurrence: recurrence || "none",
      visibleFrom: recurrence === "none" ? today : new Date(visibleFrom),
    });

    await newEvent.save();
    res.status(201).json({ success: true, message: "Event created successfully", data: newEvent });
  } catch (error) {
    console.error("CREATE EVENT ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE
const updateEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, date, location, description, categories, recurrence, visibleFrom } = req.body;

    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (typeof title === "string") event.title = title;
    if (typeof date === "string") event.date = date;
    if (typeof location === "string") event.location = location;
    if (typeof description === "string") event.description = description;
    if (categories !== undefined) event.categories = categories;

    if (recurrence) {
      if (!["none", "monthly", "yearly"].includes(recurrence)) {
        return res.status(400).json({ message: "Invalid recurrence type" });
      }
      event.recurrence = recurrence;
      if (recurrence === "none") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        event.visibleFrom = today;
      } else {
        if (!visibleFrom) return res.status(400).json({ message: "visibleFrom is required" });
        event.visibleFrom = new Date(visibleFrom);
      }
    }

    if (req.file) {
      if (event.imageId) await cloudinary.uploader.destroy(event.imageId);
      const imgRes = await uploadToCloudinary(req.file.buffer, "events");
      event.image = imgRes.secure_url;
      event.imageId = imgRes.public_id;
    }

    await event.save();

    // SYNC LINKED SUBMISSION
    const submission = await EventSubmission.findOne({ approvedEventId: event._id });
    if (submission) {
      if (title) submission.title = title;
      if (date) submission.date = date;
      if (location) submission.location = location;
      if (description) submission.description = description;
      if (categories) submission.categories = categories;
      if (recurrence) submission.recurrence = recurrence;
      if (visibleFrom) submission.visibleFrom = visibleFrom;
      if (req.file) {
        submission.image = event.image;
        submission.imageId = event.imageId;
      }
      await submission.save();
    }

    res.json({ success: true, message: "Event updated successfully", data: event });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// SOFT DELETE
const deleteEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    event.isDeleted = true;
    event.deletedAt = new Date();
    await event.save();

    // Soft delete linked submission too
    if (event.createdFromSubmission) {
      await EventSubmission.findByIdAndUpdate(event.createdFromSubmission, {
        isDeleted: true,
        deletedAt: new Date(),
      });
    }

    res.json({ message: "Event moved to deleted list" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// RECOVER
const recoverEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    console.log("=== RECOVER EVENT ===");
    console.log("createdFromSubmission:", event.createdFromSubmission);

    if (event.createdFromSubmission) {
      const linkedSubmission = await EventSubmission.findById(
        event.createdFromSubmission
      );

      if (linkedSubmission) {
        // ✅ Reset submission to pending
        linkedSubmission.isDeleted = false;
        linkedSubmission.deletedAt = null;
        linkedSubmission.status = "pending";
        linkedSubmission.approvedEventId = null;
        await linkedSubmission.save();

        // ✅ Delete the event
        await Event.deleteOne({ _id: event._id });

        return res.json({ message: "Event moved to pending section" });
      }
    }

    // Fallback — no submission found, just restore event
    event.isDeleted = false;
    event.deletedAt = null;
    await event.save();

    return res.json({ message: "Event recovered to events list" });
  } catch (err) {
    console.error("RECOVER EVENT ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// PERMANENT DELETE
const permanentDeleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (event.imageId) {
      try { await cloudinary.uploader.destroy(event.imageId); } catch (e) {}
    }

    // Delete linked submission too
    if (event.createdFromSubmission) {
      const submission = await EventSubmission.findById(event.createdFromSubmission);
      if (submission) {
        if (submission.imageId) {
          try { await cloudinary.uploader.destroy(submission.imageId); } catch (e) {}
        }
        await EventSubmission.findByIdAndDelete(event.createdFromSubmission);
      }
    }

    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: "Event permanently deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getAllEvents,
  getUpcomingEvents,
  getEventById,
  createEvent,
  updateEventById,
  deleteEventById,
  recoverEvent,
  permanentDeleteEvent,
};
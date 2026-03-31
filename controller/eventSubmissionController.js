const EventSubmission = require("../model/EventSubmission");
const Event = require("../model/Event");
const uploadToCloudinary = require("../middleware/cloudinaryUpload");
const cloudinary = require("../config/cloudinary");
const sendEmailWithTemplate = require("../utils/sendEmailWithTemplate");

const DEFAULT_EVENT_IMAGE = "https://res.cloudinary.com/ddni4sjyo/image/upload/v1770180830/default%20image/person_kjmhx8.jpg";

// GET ALL — admin
const getAllEventSubmissions = async (req, res) => {
  try {
    const filter = { isDeleted: { $ne: true } };
    if (req.query.status) filter.status = req.query.status;
    const data = await EventSubmission.find(filter).sort({ createdAt: -1 });
    res.json({ data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET MY — logged in user
const getMyEventSubmissions = async (req, res) => {
  try {
    const data = await EventSubmission.find({
      submittedBy: req.user._id,
      isDeleted: { $ne: true },
    }).sort({ createdAt: -1 });
    res.json({ data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// CREATE — logged in user
const createEventSubmission = async (req, res) => {
  try {
    let imageUrl = DEFAULT_EVENT_IMAGE;
    let imageId = null;

    if (req.file) {
      const uploaded = await uploadToCloudinary(req.file.buffer, "event_submissions");
      imageUrl = uploaded.secure_url;
      imageId = uploaded.public_id;
    }

    const submission = await EventSubmission.create({
      ...req.body,
      image: imageUrl,
      imageId,
      submittedBy: req.user._id,
      status: "pending",
    });

    await sendEmailWithTemplate({
      type: "NEW_EVENT_SUBMISSION",
      role: "admin",
      to: process.env.ADMIN_EMAIL,
      subject: "New Event Submitted",
      data: {
        title: submission.title,
        description: submission.description,
        category: submission.categories,
        location: submission.location,
        date: submission.date,
        recurrence: submission.recurrence,
        visibleFrom: submission.visibleFrom,
      },
    });

    res.status(201).json({ message: "Event submitted for review", data: submission });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// CREATE ADMIN SUBMISSION
const createAdminEventSubmission = async (req, res) => {
  try {
    let imageUrl = DEFAULT_EVENT_IMAGE;
    let imageId = null;

    if (req.file) {
      const uploaded = await uploadToCloudinary(
        req.file.buffer,
        "event_submissions"
      );
      imageUrl = uploaded.secure_url;
      imageId = uploaded.public_id;
    }

    // ✅ Step 1: Create submission as approved (like artist flow)
    const submission = await EventSubmission.create({
      title: req.body.title,
      description: req.body.description,
      date: req.body.date,
      location: req.body.location,
      categories: req.body.categories,
      recurrence: req.body.recurrence || "none",
      visibleFrom: req.body.visibleFrom || new Date(),
      image: imageUrl,
      imageId,
      status: "approved",
      isDeleted: false,
    });

    // ✅ Step 2: Create linked event immediately
    const event = await Event.create({
      title: submission.title,
      description: submission.description,
      date: submission.date,
      location: submission.location,
      categories: submission.categories,
      recurrence: submission.recurrence,
      visibleFrom: submission.visibleFrom,
      image: submission.image,
      imageId: submission.imageId,
      createdFromSubmission: submission._id,
      isDeleted: false,
    });

    // ✅ Step 3: Link back
    submission.approvedEventId = event._id;
    await submission.save();

    res.status(201).json({
      message: "Event created successfully",
      data: event,
    });
  } catch (err) {
    console.error("ADMIN EVENT SUBMISSION ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// APPROVE
const approveEvent = async (req, res) => {
  try {
    const submission = await EventSubmission.findById(req.params.id).populate("submittedBy", "email");
    if (!submission) return res.status(404).json({ message: "Submission not found" });

    if (submission.status === "approved") {
      return res.json({ message: "Already approved" });
    }

    let event;

    // ✅ Check via approvedEventId first
    if (submission.approvedEventId) {
      event = await Event.findById(submission.approvedEventId);
      if (event) {
        event.isDeleted = false;
        event.deletedAt = null;
        await event.save();
      }
    }

    // ✅ Check via createdFromSubmission (after recover, approvedEventId is null)
    if (!event) {
      event = await Event.findOne({
        createdFromSubmission: submission._id,
        isDeleted: false,
      });
    }

    // ✅ Create fresh event only if truly none exists
    if (!event) {
      event = await Event.create({
        title: submission.title,
        description: submission.description,
        date: submission.date,
        location: submission.location,
        categories: submission.categories,
        recurrence: submission.recurrence || "none",
        visibleFrom: submission.visibleFrom || new Date(),
        image: submission.image,
        imageId: submission.imageId,
        createdFromSubmission: submission._id,
        isDeleted: false,
      });
    }

    submission.approvedEventId = event._id;
    submission.status = "approved";
    await submission.save();

    await sendEmailWithTemplate({
      type: "EVENT_APPROVED",
      role: "user",
      to: submission.submittedBy.email,
      subject: "Event Approved",
      data: {
        title: submission.title,
        description: submission.description,
        category: submission.categories,
        location: submission.location,
        date: submission.date,
        recurrence: submission.recurrence,
        visibleFrom: submission.visibleFrom,
      },
    });

    res.json({ message: "Event approved and visible in list" });
  } catch (err) {
    console.error("APPROVE EVENT ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// REJECT
const rejectEvent = async (req, res) => {
  const { reason } = req.body;
  try {
    const submission = await EventSubmission.findById(req.params.id).populate("submittedBy", "email");
    if (!submission) return res.status(404).json({ message: "Submission not found" });

    if (submission.approvedEventId) {
      await Event.findByIdAndDelete(submission.approvedEventId);
      submission.approvedEventId = null;
    }

    submission.status = "rejected";
    await submission.save();

    await sendEmailWithTemplate({
      type: "EVENT_REJECTED",
      role: "user",
      to: submission.submittedBy.email,
      subject: "Event Rejected",
      data: {
        title: submission.title,
        description: submission.description,
        category: submission.categories,
        location: submission.location,
        date: submission.date,
        recurrence: submission.recurrence,
        visibleFrom: submission.visibleFrom,
        reason: reason || "Your submission did not meet our criteria",
      },
    });

    res.json({ message: "Event rejected" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// SOFT DELETE
const deleteEventSubmission = async (req, res) => {
  try {
    const submission = await EventSubmission.findById(req.params.id);
    if (!submission) return res.status(404).json({ message: "Submission not found" });

    // Soft delete linked event too
    if (submission.approvedEventId) {
      await Event.findByIdAndUpdate(submission.approvedEventId, {
        isDeleted: true,
        deletedAt: new Date(),
      });
      submission.approvedEventId = null;
    }

    submission.isDeleted = true;
    submission.deletedAt = new Date();
    await submission.save();

    res.json({ message: "Moved to deleted list" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// UPDATE
const updateEventSubmission = async (req, res) => {
  try {
    const submission = await EventSubmission.findById(req.params.id);
    if (!submission) return res.status(404).json({ message: "Submission not found" });

    const { title, description, date, location, categories, recurrence, visibleFrom } = req.body;

    if (title) submission.title = title;
    if (description) submission.description = description;
    if (date) submission.date = date;
    if (location) submission.location = location;
    if (categories) submission.categories = categories;
    if (recurrence) submission.recurrence = recurrence;
    if (visibleFrom) submission.visibleFrom = visibleFrom;

    if (req.file) {
      if (submission.imageId) {
        try { await cloudinary.uploader.destroy(submission.imageId); } catch (e) { }
      }
      const uploaded = await uploadToCloudinary(req.file.buffer, "event_submissions");
      submission.image = uploaded.secure_url;
      submission.imageId = uploaded.public_id;
    }

    await submission.save();

    // SYNC LINKED EVENT
    if (submission.approvedEventId) {
      const event = await Event.findById(submission.approvedEventId);
      if (event) {
        if (title) event.title = title;
        if (description) event.description = description;
        if (date) event.date = date;
        if (location) event.location = location;
        if (categories) event.categories = categories;
        if (recurrence) event.recurrence = recurrence;
        if (visibleFrom) event.visibleFrom = visibleFrom;
        if (req.file) {
          event.image = submission.image;
          event.imageId = submission.imageId;
        }
        await event.save();
      }
    }

    res.json({ message: "Event updated successfully", data: submission });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET DELETED
const getDeletedEventSubmissions = async (req, res) => {
  try {
    const data = await EventSubmission.find({ isDeleted: true }).sort({ deletedAt: -1 });
    res.json({ data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// RECOVER
const recoverEventSubmission = async (req, res) => {
  try {
    const submission = await EventSubmission.findById(req.params.id);
    if (!submission) return res.status(404).json({ message: "Submission not found" });

    if (submission.approvedEventId) {
      await Event.findByIdAndDelete(submission.approvedEventId);
      submission.approvedEventId = null;
    }

    submission.isDeleted = false;
    submission.deletedAt = null;
    submission.status = "pending";
    await submission.save();

    res.json({ message: "Submission recovered to pending" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PERMANENT DELETE
const permanentDeleteEventSubmission = async (req, res) => {
  try {
    const submission = await EventSubmission.findById(req.params.id);
    if (!submission) return res.status(404).json({ message: "Submission not found" });

    if (submission.approvedEventId) {
      const event = await Event.findById(submission.approvedEventId);
      if (event) {
        if (event.imageId) {
          try { await cloudinary.uploader.destroy(event.imageId); } catch (e) { }
        }
        await Event.findByIdAndDelete(submission.approvedEventId);
      }
    }

    if (submission.imageId) {
      try { await cloudinary.uploader.destroy(submission.imageId); } catch (e) { }
    }

    await EventSubmission.findByIdAndDelete(req.params.id);
    res.json({ message: "Permanently deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
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
};
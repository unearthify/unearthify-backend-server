const EventSubmission = require("../model/EventSubmission");
const Event = require("../model/Event");
const uploadToCloudinary = require("../middleware/cloudinaryUpload");
const cloudinary = require("../config/cloudinary");
const sendEmailWithTemplate = require("../utils/sendEmailWithTemplate");

const DEFAULT_EVENT_IMAGE = "https://res.cloudinary.com/ddni4sjyo/image/upload/v1770180830/default%20image/person_kjmhx8.jpg";

// CREATE — artist submits, goes to pending
const createSubmission = async (req, res) => {
  try {
    const {
      title, description, date, location,
      categories, recurrence, visibleFrom,
    } = req.body;

    let mainImg = null;

    if (req.file) {
      mainImg = await uploadToCloudinary(req.file.buffer, "event_submissions");
    }

    const submission = await EventSubmission.create({
      title, description, date, location,
      categories, recurrence, visibleFrom,
      image: mainImg?.secure_url || DEFAULT_EVENT_IMAGE,
      imageId: mainImg?.public_id || null,
      submittedBy: req.user?._id || null,
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
      },
    });

    res.status(201).json({
      message: "Submitted for admin review",
      data: submission,
    });
  } catch (error) {
    console.error("SUBMISSION ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

const createBulkEventSubmissions = async (req, res) => {
  try {
    if (!req.body.events) {
      return res.status(400).json({ message: "Events payload missing" });
    }

    let eventsPayload;

    try {
      eventsPayload =
        typeof req.body.events === "string"
          ? JSON.parse(req.body.events)
          : req.body.events;
    } catch (err) {
      return res.status(400).json({ message: "Invalid events JSON" });
    }

    if (!Array.isArray(eventsPayload) || eventsPayload.length === 0) {
      return res.status(400).json({ message: "Invalid events data" });
    }

    let uploadedFiles = [];

    if (req.files?.image) {
      uploadedFiles = req.files.image;
    }

    const uploadPromises = eventsPayload.map(async (event, i) => {
      let imageUrl = DEFAULT_EVENT_IMAGE; // define this constant like you did for artists
      let imageId = null;

      const file = uploadedFiles[i];

      if (file) {
        const uploaded = await uploadToCloudinary(
          file.buffer,
          "event_submissions"
        );
        imageUrl = uploaded.secure_url;
        imageId = uploaded.public_id;
      }

      return {
        title: event.title,
        description: event.description,
        date: event.date,
        visibleFrom: event.visibleFrom || event.date,
        location: event.location,
        categories: event.categories,
        recurrence: event.recurrence || "none",
        image: imageUrl,
        imageId: imageId,
        status: "pending",
      };
    });

    const preparedEvents = await Promise.all(uploadPromises);

    const submissions = await EventSubmission.insertMany(preparedEvents);

    res.status(201).json({
      message: "Bulk event submissions created",
      count: submissions.length,
      data: submissions,
    });
  } catch (error) {
    console.error("BULK EVENT SUBMISSION ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// GET MY — logged in artist
const getMySubmissions = async (req, res) => {
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

// GET ALL — admin
const getAllSubmissions = async (req, res) => {
  try {
    const filter = {
      isDeleted: { $ne: true },
    };

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const data = await EventSubmission.find(filter).sort({ createdAt: -1 });

    res.json({ data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET DELETED
const getDeletedSubmissions = async (req, res) => {
  try {
    const data = await EventSubmission.find({
      isDeleted: true,
    }).sort({ deletedAt: -1 });

    res.json({ data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// APPROVE — mirrors approveSubmission exactly
const approveSubmission = async (req, res) => {
  try {
    const submission = await EventSubmission.findById(req.params.id);

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    let event;

    // 1. If already linked → restore
    if (submission.approvedEventId) {
      event = await Event.findById(submission.approvedEventId);

      if (event) {
        event.isDeleted = false;
        event.deletedAt = null;
        await event.save();
      }
    }

    // 2. If no linked event → create new
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
        isDeleted: false,
      });
    }

    // 3. Link submission
    submission.approvedEventId = event._id;
    submission.status = "approved";
    await submission.save();

    // Send email if artist submitted
    if (submission.submittedBy) {
      const populated = await submission.populate("submittedBy", "email");
      if (populated.submittedBy?.email) {
        await sendEmailWithTemplate({
          type: "EVENT_APPROVED",
          role: "user",
          to: populated.submittedBy.email,
          subject: "Your Event Was Approved",
          data: {
            title: submission.title,
            description: submission.description,
            category: submission.categories,
            location: submission.location,
            date: submission.date,
          },
        });
      }
    }

    res.json({ message: "Event approved and visible in list" });
  } catch (error) {
    console.error("APPROVE ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// REJECT — mirrors rejectSubmission exactly
const rejectSubmission = async (req, res) => {
  const { reason } = req.body;
  try {
    const submission = await EventSubmission.findById(req.params.id);

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    if (submission.approvedEventId) {
      await Event.findByIdAndDelete(submission.approvedEventId);
      submission.approvedEventId = null;
    }

    submission.status = "rejected";
    submission.rejectionReason = reason || "No reason provided";
    await submission.save();

    // Send email if artist submitted
    if (submission.submittedBy) {
      const populated = await submission.populate("submittedBy", "email");
      if (populated.submittedBy?.email) {
        await sendEmailWithTemplate({
          type: "EVENT_REJECTED",
          role: "user",
          to: populated.submittedBy.email,
          subject: "Your Event Was Rejected",
          data: {
            title: submission.title,
            description: submission.description,
            category: submission.categories,
            location: submission.location,
            date: submission.date,
            reason: submission.rejectionReason || "Your submission did not meet our criteria",
          },
        });
      }
    }

    res.json({ message: "Submission rejected" });
  } catch (error) {
    console.error("REJECT ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// SOFT DELETE — mirrors deleteSubmission exactly
const deleteSubmission = async (req, res) => {
  try {
    const submission = await EventSubmission.findById(req.params.id);

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    // Delete linked Event also
    if (submission.approvedEventId) {
      await Event.findByIdAndDelete(submission.approvedEventId);
      submission.approvedEventId = null;
    }

    // Soft delete submission
    submission.isDeleted = true;
    submission.deletedAt = new Date();
    await submission.save();

    res.json({ message: "Submission and linked event deleted" });
  } catch (error) {
    console.error("DELETE SUBMISSION ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// RECOVER — mirrors recoverSubmission exactly
const recoverSubmission = async (req, res) => {
  try {
    const submission = await EventSubmission.findById(req.params.id);

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    submission.isDeleted = false;
    submission.deletedAt = null;
    submission.status = "pending";
    await submission.save();

    res.json({ message: "Submission recovered to pending" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PERMANENT DELETE — mirrors permanentDeleteSubmission exactly
const permanentDeleteSubmission = async (req, res) => {
  try {
    const submission = await EventSubmission.findById(req.params.id);

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    if (submission.imageId) {
      try {
        await cloudinary.uploader.destroy(submission.imageId);
      } catch (err) {
        console.error("Cloudinary delete failed:", err.message);
      }
    }

    // Delete linked event also
    if (submission.approvedEventId) {
      await Event.findByIdAndDelete(submission.approvedEventId);
    }

    await EventSubmission.findByIdAndDelete(req.params.id);

    res.json({ message: "Submission permanently deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE — mirrors updateSubmission exactly
const updateSubmission = async (req, res) => {
  try {
    const submission = await EventSubmission.findById(req.params.id);

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    const {
      title, description, date, location,
      categories, recurrence, visibleFrom,
    } = req.body;

    if (title) submission.title = title;
    if (description) submission.description = description;
    if (date) submission.date = date;
    if (location) submission.location = location;
    if (categories) submission.categories = categories;
    if (recurrence) submission.recurrence = recurrence;
    if (visibleFrom) submission.visibleFrom = visibleFrom;

    if (req.file) {
      if (submission.imageId) {
        try {
          await cloudinary.uploader.destroy(submission.imageId);
        } catch (err) {
          console.error("Old image delete failed:", err.message);
        }
      }
      const uploaded = await uploadToCloudinary(req.file.buffer, "event_submissions");
      submission.image = uploaded.secure_url;
      submission.imageId = uploaded.public_id;
    }

    await submission.save();

    // Sync linked Event if approved
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

    res.json({ message: "Submission updated successfully", data: submission });
  } catch (error) {
    console.error("UPDATE SUBMISSION ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

const remindSubmission = async (req, res) => {
  try {
    const submission = await EventSubmission.findById(req.params.id);

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    if (submission.status !== "pending") {
      return res.status(400).json({ message: "Reminder only allowed for pending submissions" });
    }

    await sendEmailWithTemplate({
      type: "EVENT_SUBMISSION_REMINDER",
      role: "admin",
      to: process.env.ADMIN_EMAIL,
      subject: "Reminder: Event Submission Still Pending",
      data: {
        title: submission.title,
        description: submission.description,
        category: submission.categories,
        location: submission.location,
        date: submission.date,
        submittedAt: new Date(submission.createdAt).toLocaleDateString("en-IN", {
          day: "numeric", month: "long", year: "numeric",
        }),
      },
    });

    res.json({ message: "Reminder sent to admin" });
  } catch (error) {
    console.error("REMIND ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
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
};
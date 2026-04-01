const mongoose = require("mongoose");

const EventSubmissionSchema = new mongoose.Schema({
  title: String,
  description: String,
  date: Date,
  location: String,
  categories: String,
  recurrence: String,
  visibleFrom: Date,

  image: String,
  imageId: String,

  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ArtistRequest",
  },

  approvedEventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
    default: null,
  },

  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  rejectionReason: {
    type: String,
  },

  isDeleted: {
    type: Boolean,
    default: false,
  },

  deletedAt: Date,
}, { timestamps: true });

module.exports = mongoose.model("EventSubmission", EventSubmissionSchema);
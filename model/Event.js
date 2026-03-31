const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    date: {
      type: Date,
      required: true,
    },

    location: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    categories: {
      type: String,
      required: true,
    },
    imageId: {
      type: String,
      required: true,
    },
    recurrence: {
      type: String,
      enum: ["none", "monthly", "yearly"],
      default: "none",
    },
    visibleFrom: {
      type: Date,
      required: true,
    },
    createdFromSubmission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EventSubmission",
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: Date,

  },
  {
    timestamps: true,
  },
);

const Event = mongoose.model("Event", EventSchema);

module.exports = Event;

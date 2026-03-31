const mongoose = require("mongoose");

const contactArtistSchema = new mongoose.Schema(
  {
    artistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Artist",
      required: true,
      index: true,
    },

    artistName: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ArtCategory",
      required: true,
    },

    artTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    artTypeName: {
      type: String,
      required: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      match: [/^[0-9]{10}$/, "Invalid phone number"],
    },

    email: {
      type: String,
      required: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email"],
      lowercase: true,
      trim: true,
    },

    message: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const ContactArtist = mongoose.model(
  "ContactArtist",
  contactArtistSchema
);

module.exports = ContactArtist;
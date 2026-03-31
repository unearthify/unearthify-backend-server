const mongoose = require("mongoose");

const ArtistSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    artTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ArtCategory",
      required: true,
      trim: true,
    },
    artTypeName: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      required: true,
    },
    imageId: {
      type: String,
      required: null,
    },
    bio: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email"],
      lowercase: true,
      trim: true,
    },

    website: {
      type: String,
      default: "",
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    collection: [
      {
        url: { type: String, required: true },
        imageId: { type: String, required: true },
      },
    ],
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

ArtistSchema.index(
  { name: 1, artTypeId: 1, city: 1, state: 1 },
  { unique: true }
);

const Artist = mongoose.model("Artist", ArtistSchema);

module.exports = Artist;

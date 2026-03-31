const mongoose = require("mongoose");

const ArtTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  image: {
    type: String,
    required: true
  },
  imageId: {
    type: String,
    required: true
  },
});

const ArtCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
      required: true
    },
    imageId: {
      type: String,
      required: true
    },
    artTypes: [ArtTypeSchema],
  },
  {
    timestamps: true,
  }
);

const ArtCategory = mongoose.model("ArtCategory", ArtCategorySchema);

module.exports = ArtCategory;

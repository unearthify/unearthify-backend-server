const mongoose = require("mongoose");

const artistRequestSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  phone: String,
  password: String,
  about: String,
  specialization: [String],
  experience: String,
  city: String,
  state: String,
  website: String,

  profileImage: Buffer,
  mimetype: String,

  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
}, { timestamps: true });

module.exports = mongoose.model("ArtistRequest", artistRequestSchema);
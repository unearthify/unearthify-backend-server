const mongoose = require("mongoose");

const artistApplicationSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  password: String,

  about: String,
  specialization: [String],
  experience: String,
  city: String,
  state: String,
  website: String,
  profileImage: String,

  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
}, { timestamps: true });

module.exports = mongoose.model("artistApplication", artistApplicationSchema);
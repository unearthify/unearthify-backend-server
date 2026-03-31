const mongoose = require("mongoose");

const FamilyMemberSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
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
      require: true,
    },
    instagramLink: {
      type: String,
      trim: true,
    },
    linkedinLink: {
      type: String,
      trim: true,
    },
     mobilenumber: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const FamilyMember = mongoose.model("FamilyMember", FamilyMemberSchema);

module.exports = FamilyMember;

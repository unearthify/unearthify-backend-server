const mongoose = require("mongoose");

const ContributeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    mobileNumber: {
      type: String,
      required: true,
      trim: true,
      match: [/^[0-9]{10}$/, "Mobile number must be exactly 10 digits"],
    },

    contributionType: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
      maxLength: [1000, "Description cannot exceed 1000 characters"],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Contribute", ContributeSchema);

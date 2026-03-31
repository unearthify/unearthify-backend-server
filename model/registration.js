const mongoose = require("mongoose");

const Registration = new mongoose.Schema({
  FirstName: { type: String},
  LastName: { type: String},
  Email: { type: String },
  Password: { type: String},
  status: { type: String, default: "pending" },
  resetToken: { type: String },
  resetTokenExpiration: { type: Date },
  
});

// Register the schema as a model
const RegisterDetails = mongoose.model("register", Registration);
module.exports = RegisterDetails;

// This model is deprecated.
// See ArtCategory.js and ArtDetail.js

const mongoose = require("mongoose");
const ArtFormSchema = new mongoose.Schema({});
const ArtForm = mongoose.model("ArtForm", ArtFormSchema);
module.exports = ArtForm;

const ContactArtist = require("../model/ContactArtist");
const Artist = require("../model/Artist");
const ArtistSubmission = require("../model/ArtistSubmission");

// ContactArtistController.js
const getContactRequests = async (req, res) => {
  try {
    const contacts = await ContactArtist.find()
      .populate("category", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: contacts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMyContactRequests = async (req, res) => {
  try {
    // Step 1: Find all approved submissions by this logged-in user
    const mySubmissions = await ArtistSubmission.find({
      submittedBy: req.user._id,
      status: "approved",
      approvedArtistId: { $ne: null },
      isDeleted: false,
    }).select("approvedArtistId");

    if (!mySubmissions.length) {
      return res.status(200).json({ success: true, data: [] });
    }

    // Step 2: Extract all approvedArtistIds
    const myArtistIds = mySubmissions.map((s) => s.approvedArtistId);

    // Step 3: Find contacts where artistId matches any of those
    const contacts = await ContactArtist.find({
      artistId: { $in: myArtistIds },
    })
      .populate("category", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: contacts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// CREATE CONTACT REQUEST
const createContactArtist = async (req, res) => {
  try {
    const {
      artistId,
      artistName,
      category,
      artTypeId,
      artTypeName,
      name,
      phone,
      email,
      message,
    } = req.body;

    if (!artistId || !artistName || !category || !artTypeId || !name || !phone || !email || !message) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be filled",
      });
    }

    const newContact = await ContactArtist.create({
      artistId,
      artistName,
      category,
      artTypeId,
      artTypeName,
      name,
      phone,
      email,
      message,
    });

    res.status(201).json({
      success: true,
      message: "Contact request sent successfully",
      data: newContact,
    });
  } catch (error) {
    console.error("Contact Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ContactArtistController.js
const deleteContactRequest = async (req, res) => {
  try {
    const { id } = req.params;
    await ContactArtist.findByIdAndDelete(id);
    res.json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getContactRequests,
  createContactArtist,
  deleteContactRequest,
  getMyContactRequests,
};
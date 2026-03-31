const ContactArtist = require("../model/ContactArtist");

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

};
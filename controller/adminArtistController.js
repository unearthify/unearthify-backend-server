const ArtistRequest = require("../model/ArtistRequest");
const uploadToCloudinary = require("../middleware/cloudinaryUpload");
const sendEmailWithTemplate = require("../utils/sendEmailWithTemplate");

// GET ALL (pending + approved + rejected)
const getAll = async (req, res) => {
  try {
    const data = await ArtistRequest.find().select("-password");
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET PENDIN REQUESTS
const getPending = async (req, res) => {
  try {
    const data = await ArtistRequest.find({ status: "pending" }).select("-password");
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// APPROVE
const approve = async (req, res) => {
  try {
    const { id } = req.params;

    const artist = await ArtistRequest.findById(id);

    if (!artist) {
      return res.status(404).json({ error: "Artist not found" });
    }

    artist.status = "approved";
    await artist.save();

    // 🔥 SEND EMAIL
    await sendEmailWithTemplate({
      type: "ARTIST_SIGNUP_APPROVED",
      role: "user",
      to: artist.email,
      subject: "Your Application is Approved!",
      data: {
        name: artist.name,
        email: artist.email,
        phone: artist.phone,
        website: artist.website,
        location: `${artist.city}, ${artist.state}`,
        specialization: Array.isArray(artist.specialization)
          ? artist.specialization.join(", ")
          : artist.specialization,
        experience: artist.experience,
        about: artist.about,
      },
    });

    res.json({ message: "Approved + Email Sent" });

  } catch (err) {
    console.error("Approve error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// REJECT
const reject = async (req, res) => {
  const { reason } = req.body;
  try {
    const { id } = req.params;

    const artist = await ArtistRequest.findById(id);

    if (!artist) {
      return res.status(404).json({ error: "Artist not found" });
    }

    artist.status = "rejected";
    await artist.save();

    // 🔥 SEND EMAIL
    await sendEmailWithTemplate({
      type: "ARTIST_SIGNUP_REJECTED",
      role: "user",
      to: artist.email,
      subject: "Signup Rejected",
      data: {
        name: artist.name,
        email: artist.email,
        phone: artist.phone,
        website: artist.website,
        location: `${artist.city}, ${artist.state}`,
        description: artist.about,
        specialization: artist.specialization,
        experience: artist.experience,
        about: artist.about,
        reason: reason || "Your submission did not meet our criteria",
      },
    });

    res.json({ message: "Rejected + Email Sent" });

  } catch (err) {
    console.error("Reject error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getPending,
  approve,
  reject,
  getAll,
};
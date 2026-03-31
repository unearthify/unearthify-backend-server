const ArtistRequest = require("../model/ArtistRequest");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sendEmailWithTemplate = require("../utils/sendEmailWithTemplate");

// SIGNUP
exports.artistSignup = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      about,
      specialization,
      experience,
      city,
      state,
      website,
    } = req.body;

    const exist = await ArtistRequest.findOne({ email });
    if (exist) return res.status(400).json({ message: "Email exists" });

    const hash = await bcrypt.hash(password, 10);

    let buffer = null;
    let mimetype = null;

    if (req.file) {
      buffer = req.file.buffer;
      mimetype = req.file.mimetype;
    }

    const artist = await ArtistRequest.create({
      name,
      email,
      phone,
      password: hash,
      about,
      specialization: JSON.parse(specialization || "[]"),
      experience,
      city,
      state,
      website,
      profileImage: buffer,
      mimetype,
    });

    await sendEmailWithTemplate({
      type: "NEW_ARTIST_SIGNUP",
      role: "admin",
      to: process.env.ADMIN_EMAIL,
      subject: "New Artist Signup Request",
      data: {
        name: artist.name,
        email: artist.email,
        phone: artist.phone,
        location: `${artist.city}, ${artist.state}`,
        description: artist.about,
        specialization: artist.specialization,
        experience: artist.experience,
        website: artist.website,
        about: artist.about,
      },
    });

    res.json({ message: "Signup sent for approval" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.artistLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await ArtistRequest.findOne({ email });

    if (!user) return res.status(400).json({ message: "Not found" });

    if (user.status !== "approved") {
      return res.status(403).json({ message: "Not approved yet" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Wrong password" });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
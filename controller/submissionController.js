const ArtistSubmission = require("../model/ArtistSubmission");
const Artist = require("../model/Artist");
const uploadToCloudinary = require("../middleware/cloudinaryUpload");
const cloudinary = require("../config/cloudinary");
const DEFAULT_ARTIST_IMAGE = "https://res.cloudinary.com/ddni4sjyo/image/upload/v1770180830/default%20image/person_kjmhx8.jpg";
const sendEmailWithTemplate = require("../utils/sendEmailWithTemplate");

const createSubmission = async (req, res) => {
  try {
    const {
      name, category, artTypeId, artTypeName,
      city, state, country, bio,
      phone, email, website
    } = req.body;

    let mainImg = null;

    if (req.files?.image?.[0]) {
      mainImg = await uploadToCloudinary(
        req.files.image[0].buffer,
        "artist_submissions",
      );
    }

    const submission = await ArtistSubmission.create({
      name, category, artTypeId, artTypeName,
      city, state, country, bio,
      phone, email, website,
      image: mainImg?.secure_url,
      imageId: mainImg?.public_id,
      submittedBy: req.user?._id || null,
    });

    await submission.populate("category", "name");

    await sendEmailWithTemplate({
      type: "NEW_ARTIST_SUBMISSION",
      role: "admin",
      to: process.env.ADMIN_EMAIL,
      subject: "New Artist Submission",
      data: {
        name: submission.name,
        email: submission.email,
        phone: submission.phone,
        category: submission.category.name,
        artTypeName: submission.artTypeName,
        location: `${submission.city}, ${submission.state}`,
        description: submission.bio,
      },
    });

    res.status(201).json({
      message: "Submitted for admin review",
      data: submission,
    });
  } catch (error) {
    console.error("SUBMISSION ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

const getMySubmissions = async (req, res) => {
  try {
    const data = await ArtistSubmission.find({
      submittedBy: req.user._id,
      isDeleted: { $ne: true },
    }).sort({ createdAt: -1 });

    res.json({ data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= BULK CREATE =================
const createBulkSubmissions = async (req, res) => {
  try {
    if (!req.body.artists) {
      return res.status(400).json({ message: "Artists payload missing" });
    }

    let artistsPayload;

    try {
      artistsPayload =
        typeof req.body.artists === "string"
          ? JSON.parse(req.body.artists)
          : req.body.artists;
    } catch (err) {
      return res.status(400).json({
        message: "Invalid artists JSON",
      });
    }
    let uploadedFiles = [];

    if (req.files?.image) {
      uploadedFiles = req.files.image;
    }

    if (!Array.isArray(artistsPayload) || artistsPayload.length === 0) {
      return res.status(400).json({ message: "Invalid artists data" });
    }

    const uploadPromises = artistsPayload.map(async (artist, i) => {
      let imageUrl = DEFAULT_ARTIST_IMAGE;
      let imageId = null;

      const file = uploadedFiles[0];

      if (file) {
        const uploaded = await uploadToCloudinary(
          file.buffer,
          "artist_submissions"
        );

        imageUrl = uploaded.secure_url;
        imageId = uploaded.public_id;
      }

      return {
        name: artist.name,
        category: artist.category,
        artTypeId: artist.artTypeId,
        artTypeName: artist.artTypeName,
        city: artist.city,
        state: artist.state,
        country: artist.country,
        bio: artist.bio,
        phone: artist.phone,
        email: artist.email,
        website: artist.website,
        image: imageUrl,
        imageId: imageId,
      };
    });

    const preparedArtists = await Promise.all(uploadPromises);

    const submissions = await ArtistSubmission.insertMany(preparedArtists);

    res.status(201).json({
      message: "Bulk submissions created",
      count: submissions.length,
      data: submissions,
    });
  } catch (error) {
    console.error("BULK SUBMISSION ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// GET /api/artist-submissions?status=pending
const getAllSubmissions = async (req, res) => {
  try {
    const filter = {
      isDeleted: { $ne: true },
    };

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const data = await ArtistSubmission.find(filter).sort({
      createdAt: -1,
    });

    res.json({ data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getDeletedSubmissions = async (req, res) => {
  try {
    const data = await ArtistSubmission.find({
      isDeleted: true,
    }).sort({ deletedAt: -1 });

    res.json({ data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const recoverSubmission = async (req, res) => {
  try {
    const submission = await ArtistSubmission.findById(req.params.id);

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    submission.isDeleted = false;
    submission.deletedAt = null;
    submission.status = "pending";

    await submission.save();

    res.json({ message: "Submission recovered to pending" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const permanentDeleteSubmission = async (req, res) => {
  try {
    const submission = await ArtistSubmission.findById(req.params.id);

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    // delete image from cloudinary
    if (submission.imageId) {
      try {
        await cloudinary.uploader.destroy(submission.imageId);
      } catch (err) {
        console.error("Cloudinary delete failed:", err.message);
      }
    }

    if (submission.approvedArtistId) {
      await Artist.findByIdAndDelete(submission.approvedArtistId);
    }

    await ArtistSubmission.findByIdAndDelete(req.params.id);

    res.json({ message: "Submission permanently deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const approveSubmission = async (req, res) => {
  try {
    const submission = await ArtistSubmission.findById(req.params.id).populate("category", "name");

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    let artist;

    // 🔥 1. If already linked → restore
    if (submission.approvedArtistId) {
      artist = await Artist.findById(submission.approvedArtistId);

      if (artist) {
        artist.isDeleted = false;
        artist.deletedAt = null;
        artist.status = "active";

        await artist.save();
      }
    }

    // 🔥 2. If no linked artist → create new
    if (!artist) {
      artist = await Artist.create({
        name: submission.name,
        category: submission.category,
        artTypeId: submission.artTypeId,
        artTypeName: submission.artTypeName,
        city: submission.city,
        state: submission.state,
        country: submission.country,
        bio: submission.bio,
        phone: submission.phone,
        email: submission.email,
        website: submission.website,
        image: submission.image,
        imageId: submission.imageId,
        status: "active",
        isDeleted: false, // 🔥 IMPORTANT
      });
    }

    // 🔥 3. Link submission
    submission.approvedArtistId = artist._id;
    submission.status = "approved";

    await submission.save();

    await sendEmailWithTemplate({
      type: "ARTIST_SUBMISSION_APPROVED",
      role: "user",
      to: submission.email,
      subject: "Artist Approved",
      data: {
        name: submission.name,
        email: submission.email,
        phone: submission.phone,
        category: submission.category.name,
        artTypeName: submission.artTypeName,
        location: `${submission.city}, ${submission.state}`,
        description: submission.bio,
      },
    });

    res.json({ message: "Artist approved and visible in list" });
  } catch (error) {
    console.error("APPROVE ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

const rejectSubmission = async (req, res) => {
  const { reason } = req.body;
  try {
    const submission = await ArtistSubmission.findById(req.params.id).populate("category", "name");

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    if (submission.approvedArtistId) {
      await Artist.findByIdAndDelete(submission.approvedArtistId);
      submission.approvedArtistId = null;
    }

    submission.status = "rejected";
    submission.rejectionReason = reason || "No reason provided";
    await submission.save();

    await sendEmailWithTemplate({
      type: "ARTIST_SUBMISSION_REJECTED",
      role: "user",
      to: submission.email,
      subject: "Artist Rejected",
      data: {
        name: submission.name,
        email: submission.email,
        phone: submission.phone,
        category: submission.category.name,
        artTypeName: submission.artTypeName,
        location: `${submission.city}, ${submission.state}`,
        description: submission.bio,
        reason: submission.rejectionReason || "Your submission did not meet our criteria",
      },
    });

    res.json({ message: "Submission rejected" });
  } catch (error) {
    console.error("REJECT ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

const deleteSubmission = async (req, res) => {
  try {
    const submission = await ArtistSubmission.findById(req.params.id);

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    // 🔥 DELETE LINKED ARTIST ALSO
    if (submission.approvedArtistId) {
      await Artist.findByIdAndDelete(submission.approvedArtistId);
      submission.approvedArtistId = null;
    }

    // 🔥 SOFT DELETE SUBMISSION
    submission.isDeleted = true;
    submission.deletedAt = new Date();

    await submission.save();

    res.json({ message: "Submission and linked artist deleted" });
  } catch (error) {
    console.error("DELETE SUBMISSION ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

const createAdminSubmission = async (req, res) => {
  try {
    const {
      name, category, artTypeId, artTypeName,
      city, state, country, bio,
      phone, email, website
    } = req.body;

    let imageUrl = DEFAULT_ARTIST_IMAGE;
    let imageId = null;

    if (req.files?.image?.[0]) {
      const uploaded = await uploadToCloudinary(
        req.files.image[0].buffer,
        "artist_submissions",
      );

      imageUrl = uploaded.secure_url;
      imageId = uploaded.public_id;
    }

    const submission = await ArtistSubmission.create({
      name,
      category,
      artTypeId,
      artTypeName,
      city,
      state,
      country,
      bio,
      phone,
      email,
      website,
      image: imageUrl,
      imageId,
      status: "pending",
    });

    res.status(201).json({
      message: "Artist added to pending section",
      data: submission,
    });
  } catch (error) {
    console.error("ADMIN SUBMISSION ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

const updateSubmission = async (req, res) => {
  try {
    const submission = await ArtistSubmission.findById(req.params.id);

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    const {
      name, category, artTypeId, artTypeName,
      city, state, country, bio, phone, email, website
    } = req.body;

    if (name) submission.name = name;
    if (category) submission.category = category;
    if (artTypeId) submission.artTypeId = artTypeId;
    if (artTypeName) submission.artTypeName = artTypeName;
    if (city) submission.city = city;
    if (state) submission.state = state;
    if (country) submission.country = country;
    if (bio) submission.bio = bio;
    if (phone) submission.phone = phone;
    if (email) submission.email = email;
    if (website !== undefined) submission.website = website;

    if (req.files?.image?.[0]) {
      if (submission.imageId) {
        try {
          await cloudinary.uploader.destroy(submission.imageId);
        } catch (err) {
          console.error("Old image delete failed:", err.message);
        }
      }
      const uploaded = await uploadToCloudinary(
        req.files.image[0].buffer,
        "artist_submissions"
      );
      submission.image = uploaded.secure_url;
      submission.imageId = uploaded.public_id;
    }

    await submission.save();

    // ALSO UPDATE LINKED ARTIST
    if (submission.approvedArtistId) {
      const artist = await Artist.findById(submission.approvedArtistId);

      if (artist) {
        artist.name = submission.name;
        artist.category = submission.category;
        artist.artTypeId = submission.artTypeId;
        artist.artTypeName = submission.artTypeName;
        artist.city = submission.city;
        artist.state = submission.state;
        artist.country = submission.country;
        artist.bio = submission.bio;
        artist.phone = submission.phone;
        artist.email = submission.email;
        artist.website = submission.website;

        if (req.files?.image?.[0]) {
          artist.image = submission.image;
          artist.imageId = submission.imageId;
        }

        await artist.save();
      }
    }

    res.json({ message: "Submission updated successfully", data: submission });
  } catch (error) {
    console.error("UPDATE SUBMISSION ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

const remindSubmission = async (req, res) => {
  try {
    const submission = await ArtistSubmission.findById(req.params.id);

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    if (submission.status !== "pending") {
      return res.status(400).json({ message: "Reminder only allowed for pending submissions" });
    }

    await sendEmailWithTemplate({
      type: "ARTIST_SUBMISSION_REMINDER",
      role: "admin",
      to: process.env.ADMIN_EMAIL,
      subject: "Reminder: Artist Submission Still Pending",
      data: {
        name: submission.name,
        email: submission.email,
        phone: submission.phone,
        artTypeName: submission.artTypeName,
        location: `${submission.city}, ${submission.state}`,
        description: submission.bio,
        submittedAt: new Date(submission.createdAt).toLocaleDateString("en-IN", {
          day: "numeric", month: "long", year: "numeric",
        }),
      },
    });

    res.json({ message: "Reminder sent to admin" });
  } catch (error) {
    console.error("REMIND ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createSubmission,
  createBulkSubmissions,
  getAllSubmissions,
  approveSubmission,
  rejectSubmission,
  deleteSubmission,
  createAdminSubmission,
  getDeletedSubmissions,
  recoverSubmission,
  permanentDeleteSubmission,
  getMySubmissions,
  updateSubmission,
  remindSubmission
};

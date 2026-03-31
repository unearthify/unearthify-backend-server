const Artist = require("../model/Artist");
const cloudinary = require("../config/cloudinary");
const uploadToCloudinary = require("../middleware/cloudinaryUpload");
const mongoose = require("mongoose");
const ArtistSubmission = require("../model/ArtistSubmission");

const DEFAULT_ARTIST_IMAGE = {
  secure_url:
    "https://res.cloudinary.com/ddni4sjyo/image/upload/v1770180830/default%20image/person_kjmhx8.jpg",
  public_id: null,
};

// Get all artists
const getAllArtists = async (req, res) => {
  try {
    const { deleted } = req.query;

    let filter;

    if (deleted === "true") {
      // only deleted artists
      filter = { isDeleted: true };
    } else {
      // include old records that don't have isDeleted yet
      filter = {
        $or: [
          { isDeleted: false },
          { isDeleted: { $exists: false } }
        ]
      };
    }

    const artists = await Artist.find(filter).sort({ createdAt: -1 });

    res.json({ data: artists });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching artists",
      error: error.message,
    });
  }
};

// Get featured artists
const getFeaturedArtists = async (req, res) => {
  try {
    const artists = await Artist.find({ isFeatured: true }).sort({
      createdAt: -1,
    });
    res.json({ data: artists });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching featured artists",
      error: error.message,
    });
  }
};

// Get artist by ID
const getArtistById = async (req, res) => {
  try {
    const artist = await Artist.findById(req.params.id)
      .populate("category", "name")
    if (!artist) {
      return res.status(404).json({ message: "Artist not found" });
    }
    res.json({ data: artist });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching artist", error: error.message });
  }
};

// Create new artist
const createArtist = async (req, res) => {
  try {
    const {
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
      website
    } = req.body;

    let mainImg = DEFAULT_ARTIST_IMAGE;

    if (req.files?.image?.[0]) {
      mainImg = await uploadToCloudinary(req.files.image[0].buffer, "artists");
    }

    // upload collection
    let collection = [];
    if (req.files?.collection?.length) {
      collection = await Promise.all(
        req.files.collection.map(async (file) => {
          const res = await uploadToCloudinary(
            file.buffer,
            "artists_collection",
          );
          return { url: res.secure_url, imageId: res.public_id };
        }),
      );
    }

    const newArtist = new Artist({
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
      image: mainImg.secure_url,
      imageId: mainImg.public_id,
      collection,
    });

    await newArtist.save();

    res.status(201).json({ message: "Artist created", data: newArtist });
  } catch (error) {
    console.error("CREATE ARTIST ERROR:", error);
    res.status(500).json({
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
  }
};

// Update artist by ID
const updateArtistById = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      category,
      artTypeId,
      artTypeName,
      city,
      state,
      country,
      bio,
      status,
      isFeatured,
      phone,
      email,
      website
    } = req.body;

    const artist = await Artist.findById(id);
    if (!artist) {
      return res.status(404).json({ message: "Artist not found" });
    }

    // Update fields if provided
    if (name) artist.name = name;
    if (category) artist.category = category;
    if (artTypeId) artist.artTypeId = artTypeId;
    if (artTypeName) artist.artTypeName = artTypeName;
    if (city) artist.city = city;
    if (state) artist.state = state;
    if (country) artist.country = country;
    if (bio) artist.bio = bio;
    if (phone) artist.phone = phone;
    if (email) artist.email = email;
    if (website !== undefined) artist.website = website;
    if (status) artist.status = status;
    if (isFeatured !== undefined) artist.isFeatured = isFeatured;

    // Handle Main Image Update
    if (req.files?.image?.[0]) {
      if (artist.imageId) {
        await cloudinary.uploader.destroy(artist.imageId);
      }

      const imgRes = await uploadToCloudinary(
        req.files.image[0].buffer,
        "artists",
      );

      artist.image = imgRes.secure_url;
      artist.imageId = imgRes.public_id;
    }

    // Handle Collection Images Update (Append or Replace)
    if (req.files?.collection?.length) {
      const uploaded = await Promise.all(
        req.files.collection.map(async (file) => {
          const res = await uploadToCloudinary(
            file.buffer,
            "artists_collection",
          );
          return { url: res.secure_url, imageId: res.public_id };
        }),
      );

      artist.collection.push(...uploaded);
    }

    await artist.save();

    // ALSO UPDATE LINKED SUBMISSION
    const submission = await require("../model/ArtistSubmission").findOne({
      approvedArtistId: artist._id,
    });

    if (submission) {
      submission.name = artist.name;
      submission.category = artist.category;
      submission.artTypeId = artist.artTypeId;
      submission.artTypeName = artist.artTypeName;
      submission.city = artist.city;
      submission.state = artist.state;
      submission.country = artist.country;
      submission.bio = artist.bio;
      submission.phone = artist.phone;
      submission.email = artist.email;
      submission.website = artist.website;

      // optional: sync image also
      submission.image = artist.image;
      submission.imageId = artist.imageId;

      await submission.save();
    }

    res.json({
      message: "Artist updated successfully",
      data: artist,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating artist", error: error.message });
  }
};

// Delete artist by ID
const deleteArtistById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid artist id" });
    }

    const artist = await Artist.findById(id);
    if (!artist) {
      return res.status(404).json({ message: "Artist not found" });
    }

    // find submission by approvedArtistId
    await ArtistSubmission.findOneAndUpdate(
      { approvedArtistId: artist._id },
      {
        status: "pending",
        approvedArtistId: null,
      },
    );

    if (artist.imageId) {
      try {
        await cloudinary.uploader.destroy(artist.imageId);
      } catch (err) {
        console.error("Cloudinary main image delete failed:", err.message);
      }
    }

    if (Array.isArray(artist.collection)) {
      for (const img of artist.collection) {
        if (img.imageId) {
          try {
            await cloudinary.uploader.destroy(img.imageId);
          } catch (err) {
            console.error("Cloudinary collection delete failed:", err.message);
          }
        }
      }
    }

    await Artist.findByIdAndDelete(id);
    res.json({ message: "Artist deleted successfully" });
  } catch (error) {
    console.error("DELETE ARTIST ERROR:", error);
    res
      .status(500)
      .json({ message: "Error deleting artist", error: error.message });
  }
};

// Toggle featured status
const toggleFeaturedStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const artist = await Artist.findById(id);

    if (!artist) {
      return res.status(404).json({ message: "Artist not found" });
    }

    artist.isFeatured = !artist.isFeatured;
    await artist.save();

    res.json({
      message: `Artist ${artist.isFeatured ? "featured" : "unfeatured"} successfully`,
      data: artist,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error toggling featured status",
      error: error.message,
    });
  }
};

// SOFT DELETE
const softDeleteArtist = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    const artist = await Artist.findById(id);
    if (!artist) {
      return res.status(404).json({ message: "Artist not found" });
    }

    artist.isDeleted = true;
    artist.deletedAt = new Date();

    await artist.save();

    res.json({ message: "Artist moved to deleted list" });
  } catch (error) {
    console.error("SOFT DELETE ERROR:", error);
    res.status(500).json({
      message: "Soft delete failed",
      error: error.message,
    });
  }
};

// RECOVER
const recoverArtist = async (req, res) => {
  try {
    const { id } = req.params;

    const artist = await Artist.findById(id);
    if (!artist) {
      return res.status(404).json({ message: "Artist not found" });
    }

    // guarantee image
    const imageUrl =
      artist.image || DEFAULT_ARTIST_IMAGE.secure_url;

    let submission = await ArtistSubmission.findOne({
      approvedArtistId: artist._id,
    });

    if (submission) {
      submission.status = "pending";
      submission.isDeleted = false;
      submission.deletedAt = null;
      submission.approvedArtistId = null;

      await submission.save();
    } else {
      submission = await ArtistSubmission.create({
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
        image: artist.image,
        imageId: artist.imageId,
        status: "pending",
      });
    }

    if (!submission?._id) {
      throw new Error("Submission creation failed");
    }

    // ALWAYS remove artist
    await Artist.findByIdAndDelete(id);

    res.json({ message: "Artist moved to pending section" });
  } catch (error) {
    console.error("RECOVER ARTIST ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// PERMANENT DELETE
const permanentDeleteArtist = async (req, res) => {
  try {
    const { id } = req.params;

    const artist = await Artist.findById(id);
    if (!artist) {
      return res.status(404).json({ message: "Artist not found" });
    }

    if (artist.imageId) {
      await cloudinary.uploader.destroy(artist.imageId);
    }

    await Promise.all(
      (artist.collection || [])
        .filter((img) => img.imageId)
        .map((img) => cloudinary.uploader.destroy(img.imageId)),
    );

    // delete linked submission also
    await require("../model/ArtistSubmission").findOneAndDelete({
      approvedArtistId: artist._id,
    });

    // then delete artist
    await Artist.findByIdAndDelete(id);

    res.json({ message: "Artist and related submission permanently deleted" });
  } catch (error) {
    res.status(500).json({
      message: "Permanent delete failed",
      error: error.message,
    });
  }
};

const recoverArtistToPending = async (req, res) => {
  try {
    const { id } = req.params;

    const artist = await Artist.findById(id);
    if (!artist) {
      return res.status(404).json({ message: "Artist not found" });
    }

    // find related submission
    const submission = await ArtistSubmission.findOne({
      approvedArtistId: artist._id,
    });

    if (submission) {
      submission.status = "pending";
      submission.approvedArtistId = null;
      await submission.save();
    }

    // soft delete artist (or remove)
    await Artist.findByIdAndDelete(id);

    res.json({ message: "Artist moved back to pending submissions" });
  } catch (error) {
    console.error("RECOVER ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

const bulkCreateArtists = async (req, res) => {
  try {
    const artists = typeof req.body.artists === "string"
      ? JSON.parse(req.body.artists)
      : req.body.artists;
    let uploadedImage = DEFAULT_ARTIST_IMAGE;

    if (req.files?.image?.[0]) {
      uploadedImage = await uploadToCloudinary(
        req.files.image[0].buffer,
        "artists"
      );
    }

    if (!Array.isArray(artists) || artists.length === 0) {
      return res.status(400).json({ message: "Invalid payload" });
    }

    let inserted = 0;
    let skipped = 0;

    for (const item of artists) {
      const exists = await Artist.findOne({
        name: item.name,
        artTypeId: item.artTypeId,
        city: item.city,
        state: item.state,
      });

      if (exists) {
        skipped++;
        continue;
      }

      await Artist.create({
        name: item.name,
        category: item.category,
        artTypeId: item.artTypeId,
        artTypeName: item.artTypeName,
        city: item.city,
        state: item.state,
        country: item.country,
        bio: item.bio,
        phone: item.phone,
        email: item.email,
        website: item.website,
        image: uploadedImage.secure_url,
        imageId: uploadedImage.public_id,
      });

      inserted++;
    }

    res.json({
      message: "Bulk upload completed",
      inserted,
      skipped,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getAllArtists,
  getFeaturedArtists,
  getArtistById,
  createArtist,
  updateArtistById,
  deleteArtistById,
  toggleFeaturedStatus,
  softDeleteArtist,
  recoverArtist,
  permanentDeleteArtist,
  recoverArtistToPending,
  bulkCreateArtists
};

const mongoose = require("mongoose");

const ArtistSubmissionSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ArtCategory",
            required: true,
        },
        artTypeId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        artTypeName: {
            type: String,
            required: true,
        },
        city: {
            type: String,
            required: true,
        },
        state: {
            type: String,
            required: true,
        },
        country: {
            type: String,
            required: true,
        },
        bio: {
            type: String,
            required: true,
        },
        phone: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
        },
        website: {
            type: String,
            default: "",
        },
        image: {
            type: String,
            required: true,
        },
        imageId: {
            type: String,
            required: null,
        },
        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending",
        },
        submittedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false,
        },
        approvedArtistId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Artist",
            default: null,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
        deletedAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true },
);

module.exports = mongoose.model("ArtistSubmission", ArtistSubmissionSchema);
const ArtDetail = require("../../model/ArtDetail");
const ArtCategory = require("../../model/ArtCategory");

// Create Art Details
const createArtDetail = async (req, res) => {
  try {
    const {
      categoryId,
      artTypeId,
      language,
      state,
      materials,
      region,
      famousArtist,
      contemporaryPerformers,
      typicalLength,
      origin,
      websiteLink,
    } = req.body;

    // Validate Category exists
    const category = await ArtCategory.findById(categoryId);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    // Validate Art Type exists in that category
    // Subdocuments have _id
    const artType = category.artTypes.id(artTypeId);
    if (!artType) {
        return res.status(404).json({ success: false, message: "Art Type not found in this category" });
    }

    const newDetail = new ArtDetail({
      category: categoryId,
      artType: artTypeId,
      language,
      state,
      materials,
      region,
      famousArtist,
      contemporaryPerformers,
      typicalLength,
      origin,
      websiteLink,
    });

    await newDetail.save();

    res.status(201).json({
      success: true,
      message: "Art Details added successfully",
      data: newDetail,
    });
  } catch (error) {
    console.error("Error creating art detail:", error);
    res.status(500).json({ success: false, message: "Error creating art detail", error: error.message });
  }
};

const getAllArtDetails = async (req, res) => {
  try {
    const details = await ArtDetail.find()
      .populate("category")
      .sort({ createdAt: -1 });

    const formatted = details.map(d => {
      let artTypeObj = null;

      if (d.category && d.category.artTypes?.length) {
        artTypeObj = d.category.artTypes.find(
          a => a._id.toString() === d.artType.toString()
        );
      }

      return {
        ...d.toObject(),
        artType: artTypeObj
      };
    });

    res.status(200).json({ success: true, data: formatted });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching art details",
      error: error.message
    });
  }
};

const getArtDetailById = async (req, res) => {
  try {
    const d = await ArtDetail.findById(req.params.id).populate("category");
    if (!d) {
      return res.status(404).json({ success: false, message: "Detail not found" });
    }

    let artTypeObj = null;

    if (d.category && d.category.artTypes?.length) {
      artTypeObj = d.category.artTypes.find(
        a => a._id.toString() === d.artType.toString()
      );
    }

    res.status(200).json({
      success: true,
      data: {
        ...d.toObject(),
        artType: artTypeObj
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching detail",
      error: error.message
    });
  }
};

const updateArtDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      categoryId,
      artTypeId,
      language,
      state,
      materials,
      region,
      famousArtist,
      contemporaryPerformers,
      typicalLength,
      origin,
      websiteLink,
    } = req.body;

    const category = await ArtCategory.findById(categoryId);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    const artType = category.artTypes.id(artTypeId);
    if (!artType) {
      return res.status(404).json({ success: false, message: "Art Type not found in this category" });
    }

    const updated = await ArtDetail.findByIdAndUpdate(
      id,
      {
        category: categoryId,
        artType: artTypeId,
        language,
        state,
        materials,
        region,
        famousArtist,
        contemporaryPerformers,
        typicalLength,
        origin,
        websiteLink,
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Detail not found" });
    }

    res.status(200).json({ success: true, message: "Updated successfully", data: updated });

  } catch (error) {
    res.status(500).json({ success: false, message: "Update failed", error: error.message });
  }
};

const deleteArtDetail = async (req, res) => {
  try {
    const deleted = await ArtDetail.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Detail not found" });
    }

    res.status(200).json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Delete failed", error: error.message });
  }
};


module.exports = {
  createArtDetail,
  getAllArtDetails,
  getArtDetailById,
  updateArtDetail,
  deleteArtDetail
};

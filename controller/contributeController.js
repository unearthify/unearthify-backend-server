const Contribute = require("../model/Contribute");

// Create a new contribution
const createContribution = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: "No data received in request body",
      });
    }
    const { name, mobileNumber, contributionType, description } = req.body;

    const newContribution = new Contribute({
      name,
      mobileNumber,
      contributionType,
      description,
    });

    await newContribution.save();

    res.status(201).json({
      success: true,
      message: "Contribution submitted successfully",
      data: newContribution,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error submitting contribution",
      error: error.message,
    });
  }
};

// Get all contributions (Admin only)
const getAllContributions = async (req, res) => {
  try {
    const contributions = await Contribute.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: contributions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching contributions",
      error: error.message,
    });
  }
};

// Update contribution status (Admin only)
const updateContribution = async (req, res) => {
  try {
    const { id } = req.params;

    const contribution = await Contribute.findByIdAndUpdate(
      id,
      {
        name: req.body.name,
        mobileNumber: req.body.mobileNumber,
        contributionType: req.body.contributionType,
        description: req.body.description,
      },
      { new: true, runValidators: true }
    );

    if (!contribution) {
      return res.status(404).json({
        success: false,
        message: "Contribution not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Contribution status updated",
      data: contribution,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error updating status",
      error: error.message,
    });
  }
};

// Delete a contribution (Admin only)
const deleteContribution = async (req, res) => {
  try {
    const { id } = req.params;
    const contribution = await Contribute.findByIdAndDelete(id);

    if (!contribution) {
      return res.status(404).json({
        success: false,
        message: "Contribution not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Contribution deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting contribution",
      error: error.message,
    });
  }
};

module.exports = {
  createContribution,
  getAllContributions,
  updateContribution,
  deleteContribution,
};

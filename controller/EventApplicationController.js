const EventApplication = require("../model/EventApplication");

// Create a new application
const createEventApplication = async (req, res) => {
  try {
    const {
      eventName,
      categoryName,
      name,
      phoneNumber,
      age,
      location,
      gender,
    } = req.body;

    if (
      !eventName ||
      !categoryName ||
      !name ||
      !phoneNumber ||
      !age ||
      !location ||
      !gender
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const newApplication = new EventApplication({
  eventName,
  categoryName,
  name,
  phoneNumber,
  age,
  location,
  gender,
});

    const savedApplication = await newApplication.save();

    res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      data: savedApplication,
    });
  } catch (error) {
    console.error("Error creating application:", error);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// Get all applications (Admin)
const getAllEventApplications = async (req, res) => {
  try {
    const applications = await EventApplication.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications,
    });
  } catch (error) {
    console.error("Error fetching applications:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// Get single application by ID
const getEventApplicationById = async (req, res) => {
  try {
    const application = await EventApplication.findById(req.params.id);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }
    res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error) {
    console.error("Error fetching application:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// Update application status
const updateEventApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;

    // Validate status
    const validStatuses = ["pending", "reviewed", "accepted", "rejected"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const application = await EventApplication.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true },
    );

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Application status updated",
      data: application,
    });
  } catch (error) {
    console.error("Error updating application:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// Delete application
const deleteEventApplication = async (req, res) => {
  try {
    const application = await EventApplication.findByIdAndDelete(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Application deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting application:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

module.exports = {
  createEventApplication,
  getAllEventApplications,
  getEventApplicationById,
  updateEventApplicationStatus,
  deleteEventApplication,
};

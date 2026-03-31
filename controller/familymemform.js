const FamilyMember = require("../model/familymember");

// Create (POST)
const familyFormMemPost = async (req, res) => {
  try {
    const { name, role, description, instagramLink, linkedinLink, mobilenumber, email } = req.body;
    let image = "";

    if (req.file) {
      image = `/api/familyImage/${req.file.filename}`; 
    } else {
        return res.status(400).json({ success: false, message: "Image is required" });
    }

    const newMember = new FamilyMember({
      name,
      role,
      description,
      image,
      instagramLink,
      linkedinLink,
      mobilenumber,
      email
    });

    await newMember.save();

    res.status(201).json({
      success: true,
      message: "Family member added successfully",
      data: newMember,
    });
  } catch (error) {
    console.error("Error adding family member:", error);
    res.status(500).json({ success: false, message: "Error adding family member", error: error.message });
  }
};

// Get All
const familyMemGetAll = async (req, res) => {
  try {
    const members = await FamilyMember.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: members });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching family members", error: error.message });
  }
};

// Get Single by ID (Method 1)
const familyMemGet = async (req, res) => {
  try {
    const member = await FamilyMember.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ success: false, message: "Family member not found" });
    }
    res.json({ success: true, data: member });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching family member", error: error.message });
  }
};

// Get Single by ID (Method 2 - Redundant but requested by route)
const getFamilyMemberById = async (req, res) => {
  try {
    const member = await FamilyMember.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ success: false, message: "Family member not found" });
    }
    res.json({ success: true, data: member });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching family member", error: error.message });
  }
};

// Update
const familyMemUpdate = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (req.file) {
      updateData.image = `/api/familyImage/${req.file.filename}`;
    }

    const updatedMember = await FamilyMember.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedMember) {
      return res.status(404).json({ success: false, message: "Family member not found" });
    }

    res.json({
      success: true,
      message: "Family member updated successfully",
      data: updatedMember,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating family member", error: error.message });
  }
};

// Delete
const familyMemDelete = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedMember = await FamilyMember.findByIdAndDelete(id);

    if (!deletedMember) {
      return res.status(404).json({ success: false, message: "Family member not found" });
    }

    res.json({ success: true, message: "Family member deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting family member", error: error.message });
  }
};

module.exports = {
  familyFormMemPost,
  familyMemGet,
  familyMemGetAll,
  getFamilyMemberById,
  familyMemUpdate,
  familyMemDelete,
};

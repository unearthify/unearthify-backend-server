const uploadToCloudinary = require("../../middleware/cloudinaryUpload");
const ArtCategory = require("../../model/ArtCategory");
const cloudinary = require("../../config/cloudinary");

// Create a new Art Category with Art Types
// const createCategory = async (req, res) => {
//   try {
//     const { categoryName, categoryDescription } = req.body;
//     let { artTypes } = req.body;

//     // Parse artTypes if it's sent as a string (common in FormData)
//     if (typeof artTypes === 'string') {
//         try {
//             artTypes = JSON.parse(artTypes);
//         } catch (e) {
//             // If legitimate JSON parse fails, assume it might be a simple string (single art type name)
//             // This allows Postman users to just type "Painting" instead of full JSON
//             console.log("artTypes is not valid JSON, treating as single type Name:", artTypes);
//             artTypes = [{ name: artTypes, description: "" }];
//         }
//     }

//     if (!req.files?.image || req.files.image.length === 0) {
//       return res.status(400).json({ message: "Art type images required" });
//     }

//     if (!artTypes || !Array.isArray(artTypes)) {
//        // Final fallback if it parsed to something else (e.g. number/boolean which is rare in formData but possible)
//        if (typeof artTypes === 'object' && artTypes !== null) {
//           // It was already an object (maybe body parser handled it?), wrap in array if not array
//           artTypes = [artTypes];
//        } else {
//            return res.status(400).json({ success: false, message: "artTypes is required and must be an array (or a valid string name)." });
//        }
//     }

//     // Check if files are uploaded
//     if (!req.files || req.files.length === 0) {
//       return res.status(400).json({ success: false, message: "Art type images are required." });
//     }

//     // Verify mapping: 1 file per art type
//     if (req.files.length !== artTypes.length) {
//         return res.status(400).json({ success: false, message: "Number of images must match number of art types." });
//     }

//     // Map images to art types
//     const processedArtTypes = artTypes.map((type, index) => {
//         return {
//             name: type.name || type.artTypeName, // fallback for field naming
//             description: type.description || type.artTypeDescription,
//             image: `/api/artFormImage/${req.files[index].filename}`
//         };
//     });

//     const newCategory = new ArtCategory({
//       name: categoryName,
//       description: categoryDescription,
//       artTypes: processedArtTypes,
//     });

//     await newCategory.save();

//     res.status(201).json({
//       success: true,
//       message: "Category and Art Types created successfully",
//       data: newCategory,
//     });
//   } catch (error) {
//     console.error("Error creating category:", error);
//     res.status(500).json({ success: false, message: "Error creating category", error: error.message });
//   }
// };

const createCategory = async (req, res) => {
  try {
    const { categoryName, categoryDescription } = req.body;
    let { artTypes } = req.body;

    if (!artTypes) artTypes = [];
    if (typeof artTypes === "string") artTypes = JSON.parse(artTypes);

    if (!req.files?.categoryImage?.length) {
      return res.status(400).json({ message: "Category image required" });
    }

    const catRes = await uploadToCloudinary(
      req.files.categoryImage[0].buffer,
      "categories"
    );

    let artTypeArr = [];

    if (artTypes.length > 0) {
      if (!req.files?.image || req.files.image.length !== artTypes.length) {
        return res.status(400).json({
          message: "Art types & images count mismatch"
        });
      }

      artTypeArr = await Promise.all(
        artTypes.map(async (type, index) => {
          const imgRes = await uploadToCloudinary(
            req.files.image[index].buffer,
            "categories_types"
          );

          return {
            name: type.name,
            description: type.description,
            image: imgRes.secure_url,
            imageId: imgRes.public_id
          };
        })
      );
    }

    const newCategory = new ArtCategory({
      name: categoryName,
      description: categoryDescription,
      image: catRes.secure_url,
      imageId: catRes.public_id,
      artTypes: artTypeArr
    });

    await newCategory.save();

    res.status(201).json({
      success: true,
      message: "Category created",
      data: newCategory
    });

  } catch (e) {
    console.error("CREATE CATEGORY ERROR:", e);
    res.status(500).json({ message: "Create failed", error: e.message });
  }
};

// Get all categories (useful for the dropdown in Details page)
const getAllCategories = async (req, res) => {
    try {
        const categories = await ArtCategory.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: categories });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching categories", error: error.message });
    }
};

const getCategoryById = async (req, res) => {
    try {
        const category = await ArtCategory.findById(req.params.id);
        if(!category) {
            return res.status(404).json({ success: false, message: "Category not found"});
        }
        res.status(200).json({ success: true, data: category });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching category", error: error.message });
    }
}

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const category = await ArtCategory.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found"
      });
    }

    // update text fields
    if (name) category.name = name;
    if (description) category.description = description;

    // update image if new uploaded
    if (req.files?.categoryImage?.[0]) {
      // delete old image from cloudinary
      if (category.imageId) {
        await cloudinary.uploader.destroy(category.imageId);
      }

      // upload new image
      const imgRes = await uploadToCloudinary(
        req.files.categoryImage[0].buffer,
        "categories"
      );

      category.image = imgRes.secure_url;
      category.imageId = imgRes.public_id;
    }

    await category.save();

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: category
    });

  } catch (error) {
    console.error("UPDATE CATEGORY ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Update failed",
      error: error.message
    });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await ArtCategory.findById(id);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    // 3. delete image from cloudinary
    if (category.imageId) {
      await cloudinary.uploader.destroy(category.imageId);
    }

    // delete all art type images
    for (const artType of category.artTypes) {
      if (artType.imageId) {
        await cloudinary.uploader.destroy(artType.imageId);
      }
    }
    
    await ArtCategory.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Category deleted successfully"
    });
  } catch (error) {
    console.error("Delete category error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting category",
      error: error.message
    });
  }
};

const addArtTypeToCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    let { artTypes } = req.body;

    if (!artTypes) {
      return res.status(400).json({ message: "artTypes required" });
    }

    if (typeof artTypes === "string") {
      artTypes = JSON.parse(artTypes);
    }

    if (!req.files?.length) {
      return res.status(400).json({ message: "Art type images required" });
    }

    if (artTypes.length !== req.files.length) {
      return res.status(400).json({
        message: "Art types & images count mismatch"
      });
    }

    const newArtTypes = await Promise.all(
      artTypes.map(async (type, index) => {
        const imgRes = await uploadToCloudinary(
          req.files[index].buffer,
          "categories_types"
        );

        return {
          name: type.name,
          description: type.description,
          image: imgRes.secure_url,
          imageId: imgRes.public_id
        };
      })
    );

    const updated = await ArtCategory.findByIdAndUpdate(
      categoryId,
      { $push: { artTypes: { $each: newArtTypes } } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.status(200).json({
      success: true,
      message: "Art type added",
      data: updated,
    });

  } catch (err) {
    console.error("ADD ART TYPE ERROR:", err);
    res.status(500).json({ message: "Add art type failed", error: err.message });
  }
};

// UPDATE ART TYPE INSIDE CATEGORY

const updateArtTypeInCategory = async (req, res) => {
  try {
    const { categoryId, artTypeId } = req.params;
    const { name, description } = req.body;

    const category = await ArtCategory.findById(categoryId);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    const artType = category.artTypes.id(artTypeId);
    if (!artType) {
      return res.status(404).json({ success: false, message: "Art type not found" });
    }

    // update text
    if (name) artType.name = name;
    if (description) artType.description = description;

    // update image if new one uploaded
    if (req.files?.image?.[0]) {

      // delete old image from cloudinary
      if (artType.imageId) {
        await cloudinary.uploader.destroy(artType.imageId);
      }

      // upload new image
      const imgRes = await uploadToCloudinary(
        req.files.image[0].buffer,
        "categories_types"
      );

      artType.image = imgRes.secure_url;
      artType.imageId = imgRes.public_id;
    }

    await category.save();

    res.status(200).json({
      success: true,
      message: "Art type updated successfully",
      data: artType
    });

  } catch (error) {
    console.error("Update art type error:", error);
    res.status(500).json({ success: false, message: "Update failed", error: error.message });
  }
};

const deleteArtType = async (req, res) => {
  try {
    const { categoryId, artTypeId } = req.params;

    // 1. find category first
    const category = await ArtCategory.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // 2. find art type
    const artType = category.artTypes.id(artTypeId);
    if (!artType) {
      return res.status(404).json({ message: "Art type not found" });
    }

    // 3. delete image from cloudinary
    if (artType.imageId) {
      await cloudinary.uploader.destroy(artType.imageId);
    }

    // 4. remove art type from array
    artType.deleteOne(); // or artType.remove()

    // 5. save category
    await category.save();

    res.status(200).json({
      success: true,
      message: "Art type deleted successfully"
    });

  } catch (error) {
    console.error("DELETE ART TYPE ERROR:", error);
    res.status(500).json({ message: "Delete failed", error: error.message });
  }
};

module.exports = {
  createCategory,
  getAllCategories,
  getCategoryById,
  deleteCategory,
  updateArtTypeInCategory,
  deleteArtType,
  addArtTypeToCategory,
  updateCategory
};

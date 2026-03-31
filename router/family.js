const express = require("express");
const controller = require("../controller/familymemform");
const upload = require("../middleware/image"); // Import multer configuration
const router = express.Router();

// Define routes
router.post("/familyMemForm", upload, controller.familyFormMemPost); 
router.get("/familyMemGet/:id", controller.familyMemGet);
router.get("/AllFamilyGet",controller.familyMemGetAll)
router.get("/getById/:id",controller.getFamilyMemberById)
router.put("/familyMemUpdate/:id", upload, controller.familyMemUpdate); // Handle image upload for PUT
router.delete("/familyMemDelete/:id", controller.familyMemDelete);

module.exports = router;

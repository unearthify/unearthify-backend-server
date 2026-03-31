const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");

const {
  artistSignup,
  artistLogin,
} = require("../controller/artistAuthController");

router.post("/artists/signup", upload.single("profileImage"), artistSignup);
router.post("/artists/login", artistLogin);

module.exports = router;
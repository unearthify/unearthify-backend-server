// router.js
const express = require("express");
const controller = require("../controller/registrationForm");
const router = express.Router();
const verifyToken = require("../middleware/jwt");

router.post("/register", controller.registerPost);
router.post("/login", controller.login);
router.get("/user", verifyToken, controller.getUserData); // Get current logged in user
router.get("/userData", controller.getUser); // Get all users

router.post("/forgotPassword", controller.Forgot);
router.post("/resetPassword/:token", controller.Reset);

module.exports = router;

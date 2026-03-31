const express = require("express");
const router = express.Router();
const { getDashboardCounts } = require("../controller/dashboardController");
const { protectRoute, restrictTo } = require("../middleware/authMiddleware");

router.get("/dashboard", protectRoute, restrictTo("admin"), getDashboardCounts);

module.exports = router;

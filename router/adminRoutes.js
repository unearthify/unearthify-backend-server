const express = require("express");
const router = express.Router();

const {
  getPending,
  approve,
  reject,
  getAll,
} = require("../controller/adminArtistController");

router.get("/artists/pending", getPending);
router.put("/artists/approve/:id", approve);
router.put("/artists/reject/:id", reject);
router.get("/artists/all", getAll);

module.exports = router;
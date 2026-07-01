const express = require("express");

const router = express.Router();

const auth = require("../middleware/authMiddleware");

const { scanNetwork } = require("../controllers/scanController");

router.get("/", auth, scanNetwork);

module.exports = router;
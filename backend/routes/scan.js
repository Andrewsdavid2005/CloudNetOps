const express = require("express");

const router = express.Router();

const auth = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const { scanNetwork } = require("../controllers/scanController");

router.get("/", auth, authorize("ADMIN"), scanNetwork);

module.exports = router;
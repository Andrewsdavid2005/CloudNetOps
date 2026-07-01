const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { getAlerts, deleteAlert } = require("../controllers/alertController");

// Retrieve all alerts (Protected)
router.get("/", auth, getAlerts);

// Dismiss an alert by ID (Protected)
router.delete("/:id", auth, deleteAlert);

module.exports = router;

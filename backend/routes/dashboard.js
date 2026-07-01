const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { getDashboardData } = require("../controllers/dashboardController");

// Retrieve dashboard aggregates and chart data (Protected)
router.get("/", auth, getDashboardData);

module.exports = router;

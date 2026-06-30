const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const logger = require("./middleware/logger");
const errorHandler = require("./middleware/errorHandler");

const healthRoutes = require("./routes/health");
const authRoutes = require("./routes/auth");

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(logger);

// Root Route
app.get("/", (req, res) => {
    res.json({
        success: true,
        project: "CloudNetOps",
        message: "Welcome to CloudNetOps API 🚀",
        version: "1.0.0"
    });
});

// API Routes
app.use("/api/v1", healthRoutes);
app.use("/api/v1/auth", authRoutes);

// Global Error Handler
app.use(errorHandler);

module.exports = app;
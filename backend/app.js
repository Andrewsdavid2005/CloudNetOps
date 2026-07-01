const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

// Middleware Imports
const logger = require("./middleware/logger");
const errorHandler = require("./middleware/errorHandler");

// Route Imports
const healthRoutes = require("./routes/health");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");

const app = express();

// Global Middleware
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
app.use("/api/v1/user", userRoutes);

// Global Error Handler
app.use(errorHandler);

module.exports = app;

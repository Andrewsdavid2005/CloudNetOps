const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const logger = require("./middleware/logger");
const errorHandler = require("./middleware/errorHandler");

const healthRoutes = require("./routes/health");

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(logger);

app.use("/api/v1", healthRoutes);

app.use(errorHandler);

module.exports = app;
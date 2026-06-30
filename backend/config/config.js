require("dotenv").config();

module.exports = {
    PORT: process.env.PORT || 5000,
    NODE_ENV: process.env.NODE_ENV || "development",
    PROJECT_NAME: "CloudNetOps",
    VERSION: "1.0.0"
};
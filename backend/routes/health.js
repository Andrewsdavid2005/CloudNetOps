const express = require("express");

const router = express.Router();

router.get("/health", (req, res) => {

    res.json({
        success: true,
        project: "CloudNetOps",
        version: "1.0.0",
        status: "Healthy",
        serverTime: new Date()
    });

});

module.exports = router;
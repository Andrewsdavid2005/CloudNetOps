const express = require("express");

const router = express.Router();

const auth = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const {
    addDevice,
    getDevices,
    getDeviceById,
    updateDevice,
    deleteDevice
} = require("../controllers/deviceController");

router.post("/", auth, authorize("ADMIN"), addDevice);

router.get("/", auth, getDevices);

router.get("/:id", auth, getDeviceById);

router.put("/:id", auth, authorize("ADMIN"), updateDevice);

router.delete("/:id", auth, authorize("ADMIN"), deleteDevice);

module.exports = router;
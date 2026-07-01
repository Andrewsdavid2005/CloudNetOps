const express = require("express");

const router = express.Router();

const auth = require("../middleware/authMiddleware");

const {
    addDevice,
    getDevices,
    getDeviceById,
    updateDevice,
    deleteDevice
} = require("../controllers/deviceController");

router.post("/", auth, addDevice);

router.get("/", auth, getDevices);

router.get("/:id", auth, getDeviceById);

router.put("/:id", auth, updateDevice);

router.delete("/:id", auth, deleteDevice);

module.exports = router;
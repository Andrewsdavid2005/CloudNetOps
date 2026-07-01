const prisma = require("../config/database");

// Add Device
exports.addDevice = async (req, res) => {
    try {
        const { ip, hostname, status, latency, macAddress, vendor, operatingSystem } = req.body;

        const existing = await prisma.device.findUnique({
            where: { ip }
        });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: "Device already exists"
            });
        }

        const device = await prisma.device.create({
            data: {
                ip,
                hostname,
                status,
                latency: latency !== undefined ? Number(latency) : null,
                macAddress,
                vendor,
                operatingSystem
            }
        });

        res.status(201).json({
            success: true,
            message: "Device Added Successfully",
            device
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
// Get All Devices
exports.getDevices = async (req, res) => {

    try {

        const devices = await prisma.device.findMany();

        res.json({
            success: true,
            count: devices.length,
            devices
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};

// Get Single Device By ID
exports.getDeviceById = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const device = await prisma.device.findUnique({
            where: { id }
        });

        if (!device) {
            return res.status(404).json({
                success: false,
                message: "Device not found"
            });
        }

        res.json({
            success: true,
            device
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update Device
exports.updateDevice = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { hostname, status, latency, macAddress, vendor, operatingSystem } = req.body;

        const device = await prisma.device.update({
            where: { id },
            data: {
                hostname,
                status,
                latency: latency !== undefined ? Number(latency) : undefined,
                macAddress,
                vendor,
                operatingSystem
            }
        });

        res.json({
            success: true,
            message: "Device Updated Successfully",
            device
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Delete Device
exports.deleteDevice = async (req, res) => {

    try {

        const id = Number(req.params.id);

        await prisma.device.delete({
            where: { id }
        });

        res.json({
            success: true,
            message: "Device Deleted Successfully"
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};
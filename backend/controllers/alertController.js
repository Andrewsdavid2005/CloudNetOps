const prisma = require("../config/database");
const { sendAlertEmail } = require('../utils/email');
/**
 * Get all alerts, sorted by latest first, including the related device details.
 */
exports.getAlerts = async (req, res) => {
    try {
        const alerts = await prisma.alert.findMany({
            include: {
                device: {
                    select: {
                        id: true,
                        ip: true,
                        hostname: true,
                        macAddress: true,
                        vendor: true
                    }
                }
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        res.json({
            success: true,
            count: alerts.length,
            alerts
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Delete (dismiss) an alert by ID.
 */
exports.deleteAlert = async (req, res) => {
    try {
        const id = Number(req.params.id);

        const alert = await prisma.alert.findUnique({
            where: { id }
        });

        if (!alert) {
            return res.status(404).json({
                success: false,
                message: "Alert not found"
            });
        }

        await prisma.alert.delete({
            where: { id }
        });

        res.json({
            success: true,
            message: "Alert dismissed successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

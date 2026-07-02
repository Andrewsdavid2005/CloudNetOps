const prisma = require("../config/database");

/**
 * Retrieves aggregated statistics, chart metrics, and recent logs for the SaaS dashboard.
 */
exports.getDashboardData = async (req, res) => {
    try {
        // 1. Core Summary Cards
        const totalDevices = await prisma.device.count();
        const onlineDevices = await prisma.device.count({
            where: { status: "ONLINE" }
        });
        const offlineDevices = await prisma.device.count({
            where: { status: "OFFLINE" }
        });
        const totalAlerts = await prisma.alert.count();
        const avgLatencyResult = await prisma.device.aggregate({
            _avg: { latency: true },
            where: { status: "ONLINE" }
        });
        const averageLatency = avgLatencyResult._avg.latency || 0;

        // 2. Chart Distributions
        // A. OS distribution
        const osGroups = await prisma.device.groupBy({
            by: ["operatingSystem"],
            _count: {
                ip: true
            }
        });
        const osMap = {};
        osGroups.forEach(g => {
            const os = g.operatingSystem || "Linux / Generic";
            osMap[os] = (osMap[os] || 0) + g._count.ip;
        });
        const osDistribution = Object.keys(osMap).map(os => ({
            os,
            count: osMap[os]
        }));

        // B. Alerts severity distribution
        const severityGroups = await prisma.alert.groupBy({
            by: ["severity"],
            _count: {
                id: true
            }
        });
        const severityMap = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
        severityGroups.forEach(g => {
            const sev = g.severity ? g.severity.toUpperCase() : "LOW";
            if (sev in severityMap) {
                severityMap[sev] = g._count.id;
            }
        });
        const alertDistribution = Object.keys(severityMap).map(sev => ({
            severity: sev,
            count: severityMap[sev]
        }));

        // C. Scan activity trend (last 10 scans)
        const scanHistory = await prisma.scanHistory.findMany({
            take: 10,
            orderBy: {
                scanTime: "asc" // ascending chronological order for line charts
            }
        });
        const scanActivity = scanHistory.map(h => ({
            time: h.scanTime.toISOString(),
            devices: h.devicesFound,
            duration: h.duration
        }));

        // 3. Activity Lists (Recent 5 items)
        const recentDevices = await prisma.device.findMany({
            take: 5,
            orderBy: {
                createdAt: "desc"
            }
        });

        const recentScans = await prisma.scanHistory.findMany({
            take: 5,
            orderBy: {
                scanTime: "desc"
            }
        });

        const recentAlerts = await prisma.alert.findMany({
            take: 5,
            include: {
                device: {
                    select: {
                        ip: true,
                        hostname: true
                    }
                }
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        res.json({
            success: true,
            summary: {
                totalDevices,
                onlineDevices,
                offlineDevices,
                totalAlerts,
                averageLatency
            },
            charts: {
                statusDistribution: [
                    { name: "Online", value: onlineDevices },
                    { name: "Offline", value: offlineDevices }
                ],
                osDistribution,
                alertDistribution,
                scanActivity
            },
            recentDevices,
            recentScans,
            recentAlerts
        });

    } catch (error) {
        console.error(`[Dashboard] Controller error: ${error.message}`);
        res.status(500).json({
            success: false,
            message: "Failed to load dashboard metrics",
            error: error.message
        });
    }
};

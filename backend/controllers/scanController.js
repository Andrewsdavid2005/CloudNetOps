const { exec } = require("child_process");
const prisma = require("../config/database");
const { getPrimarySubnet } = require("../utils/subnetDetector");
const { parseNmap, parseArp, resolveVendor } = require("../utils/nmapParser");

/**
 * Execute network scanning and sync findings with the database.
 */
exports.scanNetwork = async (req, res) => {
    const startTime = Date.now();
    try {
        const subnet = getPrimarySubnet();
        console.log(`[Scanner] Starting active network scan for subnet: ${subnet}`);

        // Run Nmap Ping Scan
        exec(`nmap -sn ${subnet}`, (nmapError, nmapStdout, nmapStderr) => {
            if (nmapError) {
                console.warn(`[Scanner] Nmap execution failed or is not available. Falling back to mock scan. Reason: ${nmapError.message}`);
                return runMockScan(subnet, startTime, res);
            }

            // Run ARP -a to collect MAC addresses of discovered devices (since nmap -sn doesn't yield MACs without root/admin)
            exec("arp -a", async (arpError, arpStdout, arpStderr) => {
                try {
                    let ipMacMap = {};
                    if (!arpError && arpStdout) {
                        ipMacMap = parseArp(arpStdout);
                    }

                    // Parse discovered hosts
                    const discoveredDevices = parseNmap(nmapStdout);
                    const scanTime = new Date();

                    // Enrich MAC address and vendor info using ARP tables
                    for (const dev of discoveredDevices) {
                        if (!dev.macAddress && ipMacMap[dev.ip]) {
                            dev.macAddress = ipMacMap[dev.ip];
                            dev.vendor = resolveVendor(dev.macAddress);
                        }
                        if (!dev.macAddress) {
                            dev.macAddress = "00:00:00:00:00:00";
                            dev.vendor = "Unknown Host";
                        }
                    }

                    // Sync with database
                    const onlineIps = discoveredDevices.map(d => d.ip);
                    const existingDevices = await prisma.device.findMany();
                    const existingDeviceMap = new Map(existingDevices.map(d => [d.ip, d]));

                    const upsertedDevices = [];

                    // Upsert found devices
                    for (const dev of discoveredDevices) {
                        const existing = existingDeviceMap.get(dev.ip);
                        let dbDevice;

                        if (existing) {
                            // If coming back online
                            if (existing.status === "OFFLINE") {
                                await prisma.alert.create({
                                    data: {
                                        deviceId: existing.id,
                                        severity: "LOW",
                                        message: `Device ${existing.hostname || existing.ip} came back ONLINE.`
                                    }
                                });
                            }

                            dbDevice = await prisma.device.update({
                                where: { id: existing.id },
                                data: {
                                    status: "ONLINE",
                                    latency: dev.latency || existing.latency,
                                    hostname: dev.hostname || existing.hostname,
                                    macAddress: dev.macAddress !== "00:00:00:00:00:00" ? dev.macAddress : existing.macAddress,
                                    vendor: dev.vendor !== "Unknown Vendor" ? dev.vendor : existing.vendor,
                                    operatingSystem: dev.operatingSystem !== "Linux / Generic" ? dev.operatingSystem : existing.operatingSystem,
                                    lastSeen: scanTime
                                }
                            });
                        } else {
                            // New device discovered
                            dbDevice = await prisma.device.create({
                                data: {
                                    ip: dev.ip,
                                    hostname: dev.hostname,
                                    status: "ONLINE",
                                    latency: dev.latency || 1.0,
                                    macAddress: dev.macAddress,
                                    vendor: dev.vendor,
                                    operatingSystem: dev.operatingSystem,
                                    lastSeen: scanTime
                                }
                            });

                            await prisma.alert.create({
                                data: {
                                    deviceId: dbDevice.id,
                                    severity: "MEDIUM",
                                    message: `New device discovered on subnet: ${dbDevice.hostname || dbDevice.ip} (${dbDevice.ip})`
                                }
                            });
                        }
                        upsertedDevices.push(dbDevice);
                    }

                    // Mark missing devices as OFFLINE
                    const offlineDevices = existingDevices.filter(d => !onlineIps.includes(d.ip) && d.status === "ONLINE");
                    for (const dev of offlineDevices) {
                        await prisma.device.update({
                            where: { id: dev.id },
                            data: { status: "OFFLINE" }
                        });

                        await prisma.alert.create({
                            data: {
                                deviceId: dev.id,
                                severity: "CRITICAL",
                                message: `Device ${dev.hostname || dev.ip} (${dev.ip}) went OFFLINE.`
                            }
                        });
                    }

                    // Record ScanHistory
                    const duration = parseFloat(((Date.now() - startTime) / 1000).toFixed(2));
                    await prisma.scanHistory.create({
                        data: {
                            scanTime,
                            devicesFound: discoveredDevices.length,
                            duration
                        }
                    });

                    res.json({
                        success: true,
                        subnet,
                        scanTime,
                        devicesFound: discoveredDevices.length,
                        durationSeconds: duration,
                        devices: upsertedDevices
                    });

                } catch (dbError) {
                    console.error(`[Scanner] DB Sync Error: ${dbError.message}`);
                    res.status(500).json({
                        success: false,
                        message: `Scan finished but database sync failed: ${dbError.message}`
                    });
                }
            });
        });

    } catch (error) {
        console.error(`[Scanner] Scan Controller Error: ${error.message}`);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Fallback Mock Network Scanner for testing and demo consistency.
 */
async function runMockScan(subnet, startTime, res) {
    try {
        const scanTime = new Date();
        const subnetParts = subnet.split("/");
        const baseIp = subnetParts[0].split(".").slice(0, 3).join(".");

        const mockHosts = [
            { ip: `${baseIp}.1`, hostname: "gateway.local", macAddress: "00:15:5D:01:A2:3F", vendor: "Microsoft Hyper-V", operatingSystem: "Linux", latency: 0.8 },
            { ip: `${baseIp}.10`, hostname: "desktop-office", macAddress: "3C:D9:2B:FA:88:99", vendor: "Hewlett Packard", operatingSystem: "Windows", latency: 2.1 },
            { ip: `${baseIp}.15`, hostname: "andrews-iphone", macAddress: "F8:0F:41:BB:CC:DD", vendor: "Apple", operatingSystem: "iOS", latency: 15.4 },
            { ip: `${baseIp}.20`, hostname: "pi-server", macAddress: "B8:27:EB:11:22:33", vendor: "Raspberry Pi Foundation", operatingSystem: "Raspberry Pi OS", latency: 4.5 },
            { ip: `${baseIp}.55`, hostname: "smart-tv", macAddress: "A4:77:33:99:88:77", vendor: "Samsung", operatingSystem: "Linux", latency: 8.2 }
        ];

        const onlineIps = mockHosts.map(d => d.ip);
        const existingDevices = await prisma.device.findMany();
        const existingDeviceMap = new Map(existingDevices.map(d => [d.ip, d]));

        const upsertedDevices = [];

        for (const dev of mockHosts) {
            const existing = existingDeviceMap.get(dev.ip);
            let dbDevice;

            if (existing) {
                if (existing.status === "OFFLINE") {
                    await prisma.alert.create({
                        data: {
                            deviceId: existing.id,
                            severity: "LOW",
                            message: `Device ${existing.hostname || existing.ip} came back ONLINE.`
                        }
                    });
                }

                dbDevice = await prisma.device.update({
                    where: { id: existing.id },
                    data: {
                        status: "ONLINE",
                        latency: dev.latency,
                        hostname: dev.hostname,
                        macAddress: dev.macAddress,
                        vendor: dev.vendor,
                        operatingSystem: dev.operatingSystem,
                        lastSeen: scanTime
                    }
                });
            } else {
                dbDevice = await prisma.device.create({
                    data: {
                        ip: dev.ip,
                        hostname: dev.hostname,
                        status: "ONLINE",
                        latency: dev.latency,
                        macAddress: dev.macAddress,
                        vendor: dev.vendor,
                        operatingSystem: dev.operatingSystem,
                        lastSeen: scanTime
                    }
                });

                await prisma.alert.create({
                    data: {
                        deviceId: dbDevice.id,
                        severity: "MEDIUM",
                        message: `New device discovered on subnet (Fallback Scan): ${dbDevice.hostname || dbDevice.ip} (${dbDevice.ip})`
                    }
                });
            }
            upsertedDevices.push(dbDevice);
        }

        // Mark remaining devices offline
        const offlineDevices = existingDevices.filter(d => !onlineIps.includes(d.ip) && d.status === "ONLINE");
        for (const dev of offlineDevices) {
            await prisma.device.update({
                where: { id: dev.id },
                data: { status: "OFFLINE" }
            });

            await prisma.alert.create({
                data: {
                    deviceId: dev.id,
                    severity: "CRITICAL",
                    message: `Device ${dev.hostname || dev.ip} (${dev.ip}) went OFFLINE.`
                }
            });
        }

        const duration = parseFloat(((Date.now() - startTime) / 1000).toFixed(2));
        await prisma.scanHistory.create({
            data: {
                scanTime,
                devicesFound: mockHosts.length,
                duration
            }
        });

        res.json({
            success: true,
            subnet,
            scanTime,
            devicesFound: mockHosts.length,
            durationSeconds: duration,
            devices: upsertedDevices,
            note: "Scan executed in fallback demo mode (Nmap was not run or failed)"
        });

    } catch (error) {
        console.error(`[Scanner] Fallback Scan Error: ${error.message}`);
        res.status(500).json({
            success: false,
            message: `Mock scan failed: ${error.message}`
        });
    }
}
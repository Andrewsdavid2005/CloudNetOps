const COMMON_OUIS = {
    "0A:00:27": "VirtualBox",
    "00:05:69": "VMware",
    "00:0C:29": "VMware",
    "00:50:56": "VMware",
    "50:5A:65": "Intel / AzureWave",
    "EC:C5:58": "Huawei",
    "00:15:5D": "Microsoft Hyper-V",
    "00:1A:11": "Google",
    "3C:D9:2B": "Hewlett Packard",
    "B8:27:EB": "Raspberry Pi Foundation",
    "DC:A6:32": "Raspberry Pi Foundation",
    "F8:0F:41": "Apple",
    "E4:E0:A6": "Apple",
    "D8:30:62": "Apple",
    "00:1C:42": "Parallels",
    "00:16:3E": "Xen / AWS",
    "A4:77:33": "Samsung",
    "C4:AD:34": "Samsung",
    "70:8B:CD": "ASUSTek Computer",
    "00:E0:4C": "Realtek Semiconductor"
};

/**
 * Guesses the operating system based on the hostname.
 */
function guessOperatingSystem(hostname) {
    if (!hostname) return "Linux / Generic";
    const lower = hostname.toLowerCase();
    if (lower.includes("win") || lower.includes("desktop") || lower.includes("pc")) {
        return "Windows";
    }
    if (lower.includes("iphone") || lower.includes("ipad") || lower.includes("ios")) {
        return "iOS";
    }
    if (lower.includes("macbook") || lower.includes("mac") || lower.includes("apple")) {
        return "macOS";
    }
    if (lower.includes("android") || lower.includes("galaxy") || lower.includes("phone")) {
        return "Android";
    }
    if (lower.includes("pi") || lower.includes("raspberry")) {
        return "Raspberry Pi OS";
    }
    if (lower.includes("ubuntu") || lower.includes("debian") || lower.includes("linux")) {
        return "Linux";
    }
    return "Linux / Generic";
}

/**
 * Resolves MAC address to vendor using common OUIs list.
 */
function resolveVendor(mac) {
    if (!mac) return "Unknown Vendor";
    const cleanMac = mac.toUpperCase().replace(/[-]/g, ":");
    const oui = cleanMac.split(":").slice(0, 3).join(":");
    return COMMON_OUIS[oui] || "Unknown Vendor";
}

/**
 * Parses Nmap stdout.
 */
function parseNmap(stdout) {
    const lines = stdout.split(/\r?\n/);
    const devices = [];
    let currentDevice = null;

    const reportRegex = /Nmap scan report for (?:([^\s()]+)\s+\(([\d.]+)\)|([\d.]+))/;
    const macRegex = /MAC Address:\s+([0-9A-Fa-f:-]+)(?:\s+\(([^)]+)\))/;

    for (const line of lines) {
        const reportMatch = line.match(reportRegex);
        if (reportMatch) {
            if (currentDevice) {
                devices.push(currentDevice);
            }
            
            let hostname = null;
            let ip = null;

            if (reportMatch[3]) {
                ip = reportMatch[3];
                hostname = null;
            } else {
                hostname = reportMatch[1];
                ip = reportMatch[2];
            }

            currentDevice = {
                ip,
                hostname,
                status: "ONLINE",
                latency: null,
                macAddress: null,
                vendor: null,
                operatingSystem: guessOperatingSystem(hostname)
            };
            continue;
        }

        if (currentDevice) {
            if (line.includes("Host is up")) {
                const latencyMatch = line.match(/\(([\d.]+)(s|ms) latency\)/);
                if (latencyMatch) {
                    let lat = parseFloat(latencyMatch[1]);
                    if (latencyMatch[2] === "s") {
                        lat = lat * 1000; // convert to ms
                    }
                    currentDevice.latency = parseFloat(lat.toFixed(2));
                } else {
                    currentDevice.latency = 1.0; // default 1ms
                }
            }

            const macMatch = line.match(macRegex);
            if (macMatch) {
                currentDevice.macAddress = macMatch[1].toUpperCase().replace(/[-]/g, ":");
                currentDevice.vendor = macMatch[2] || resolveVendor(currentDevice.macAddress);
            }
        }
    }

    if (currentDevice) {
        devices.push(currentDevice);
    }

    return devices;
}

/**
 * Parses ARP table stdout (Windows/Linux compatible).
 */
function parseArp(stdout) {
    const lines = stdout.split(/\r?\n/);
    const ipMacMap = {};
    const arpRegex = /^\s*([\d.]+)\s+([0-9a-fA-F:-]{17})\s+(\w+)/; // Windows arp -a format

    for (const line of lines) {
        const match = line.match(arpRegex);
        if (match) {
            const ip = match[1];
            const mac = match[2].toUpperCase().replace(/[-]/g, ":");
            ipMacMap[ip] = mac;
        }
    }

    return ipMacMap;
}

module.exports = {
    parseNmap,
    parseArp,
    resolveVendor,
    guessOperatingSystem
};

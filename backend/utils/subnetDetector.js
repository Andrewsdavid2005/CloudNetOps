const os = require("os");

/**
 * Automatically detects the primary active IPv4 subnet in CIDR notation.
 * Filters out loopbacks and virtual network interfaces where possible.
 */
function getPrimarySubnet() {
    const interfaces = os.networkInterfaces();
    const priorityNames = ["wi-fi", "wlan", "ethernet", "local area connection", "en", "eth"];
    const candidates = [];

    for (const [name, infoList] of Object.entries(interfaces)) {
        for (const info of infoList) {
            if (info.family === "IPv4" && !info.internal) {
                // Ignore APIPA addresses
                if (info.address.startsWith("169.254")) continue;

                candidates.push({
                    name: name.toLowerCase(),
                    address: info.address,
                    netmask: info.netmask,
                    cidr: info.cidr
                });
            }
        }
    }

    if (candidates.length === 0) {
        return "127.0.0.0/24"; // Fallback to localhost subnet
    }

    // Sort candidates: prioritize matches from priorityNames, and penalize virtual/VM adapters
    candidates.sort((a, b) => {
        const indexA = priorityNames.findIndex(p => a.name.includes(p));
        const indexB = priorityNames.findIndex(p => b.name.includes(p));

        if (indexA !== -1 && indexB === -1) return -1;
        if (indexB !== -1 && indexA === -1) return 1;
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;

        const isVirtualA = a.name.includes("virtual") || a.name.includes("vbox") || a.name.includes("host-only") || a.name.includes("hostonly");
        const isVirtualB = b.name.includes("virtual") || b.name.includes("vbox") || b.name.includes("host-only") || b.name.includes("hostonly");
        if (isVirtualA && !isVirtualB) return 1;
        if (!isVirtualA && isVirtualB) return -1;

        return 0;
    });

    const primary = candidates[0];

    // Compute network address if CIDR is not natively returned by Node
    let cidr = primary.cidr;
    if (!cidr) {
        const maskParts = primary.netmask.split(".").map(Number);
        const ipParts = primary.address.split(".").map(Number);
        const netParts = ipParts.map((part, i) => part & maskParts[i]);
        const bits = maskParts.reduce((acc, part) => acc + part.toString(2).split("1").length - 1, 0);
        cidr = `${netParts.join(".")}/${bits}`;
    } else {
        // Recalculate network address to make sure the IP host bits are zeroed out (e.g. 172.22.178.0/24)
        const [ip, bits] = cidr.split("/");
        const prefixLen = parseInt(bits, 10);
        const ipParts = ip.split(".").map(Number);

        const maskParts = [];
        let tempBits = prefixLen;
        for (let i = 0; i < 4; i++) {
            if (tempBits >= 8) {
                maskParts.push(255);
                tempBits -= 8;
            } else if (tempBits > 0) {
                maskParts.push(256 - Math.pow(2, 8 - tempBits));
                tempBits = 0;
            } else {
                maskParts.push(0);
            }
        }
        const netParts = ipParts.map((part, i) => part & maskParts[i]);
        cidr = `${netParts.join(".")}/${prefixLen}`;
    }

    return cidr;
}

module.exports = { getPrimarySubnet };

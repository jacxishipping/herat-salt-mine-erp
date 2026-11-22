#!/usr/bin/env node
/**
 * Herat Salt Mine ERP — Physical Weighbridge (Kanta) RS-232 / Serial Bridge
 *
 * Reads live ASCII weight frames from Mettler Toledo / Avery / Yaohua indicators
 * over /dev/ttyUSB0 (Linux) or COM3 (Windows) and exposes a local CORS-enabled
 * JSON endpoint at http://127.0.0.1:4100/weight for the ERP Weighbridge UI.
 *
 * Usage:
 *   KANTA_SERIAL_PORT=/dev/ttyUSB0 node scripts/kanta-serial-bridge.mjs
 *   node scripts/kanta-serial-bridge.mjs --simulate
 */

import http from "node:http";
import fs from "node:fs";

const PORT = Number(process.env.KANTA_BRIDGE_PORT || 4100);
const SERIAL_PATH = process.env.KANTA_SERIAL_PORT || "/dev/ttyUSB0";
const SIMULATE = process.argv.includes("--simulate") || !fs.existsSync(SERIAL_PATH);

let latestReading = {
  scaleDeviceId: process.env.KANTA_SCALE_ID || "KANTA-GHR-01",
  weightKg: 38450,
  stable: true,
  unit: "kg",
  mode: SIMULATE ? "SIMULATED_RS232" : "HARDWARE_SERIAL",
  updatedAt: new Date().toISOString(),
};

// Parse standard industrial weighbridge ASCII frame (e.g. "ST,GS,+0038450kg")
function parseIndicatorFrame(line) {
  const match = line.match(/([+-]?\d+(?:\.\d+)?)/);
  if (!match) return null;
  const val = Math.round(Math.abs(Number(match[1])));
  if (!Number.isFinite(val)) return null;
  return {
    weightKg: val,
    stable: !line.includes("US"),
  };
}

if (SIMULATE) {
  setInterval(() => {
    const jitter = Math.floor((Math.random() - 0.5) * 40);
    latestReading = {
      ...latestReading,
      weightKg: Math.max(12000, 38450 + jitter),
      stable: Math.abs(jitter) < 15,
      updatedAt: new Date().toISOString(),
    };
  }, 1200);
} else {
  const stream = fs.createReadStream(SERIAL_PATH, { encoding: "utf8" });
  let buffer = "";
  stream.on("data", (chunk) => {
    buffer += chunk;
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() || "";
    for (const line of lines) {
      const parsed = parseIndicatorFrame(line);
      if (parsed) {
        latestReading = {
          ...latestReading,
          ...parsed,
          updatedAt: new Date().toISOString(),
        };
      }
    }
  });
}

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");
  if (req.url === "/weight") {
    res.end(JSON.stringify(latestReading));
    return;
  }
  res.statusCode = 404;
  res.end(JSON.stringify({ error: "Use GET /weight" }));
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(
    `[KANTA-BRIDGE] Listening on http://127.0.0.1:${PORT}/weight (${latestReading.mode})`
  );
});

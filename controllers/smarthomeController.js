const axios = require("axios");
const { randomUUID } = require("crypto");
const Devices = require("../models/Devices"); // Ensure we interact with MongoDB

// Home Assistant Configuration
const HOME_ASSISTANT_URL = "http://homeassistant.local:8123"; // Update if needed
const HOME_ASSISTANT_TOKEN = process.env.HOME_ASSISTANT_TOKEN; // Store in .env

// **Fetch All Devices from Home Assistant**
async function getDevices(req, res) {
  try {
    const response = await axios.get(`${HOME_ASSISTANT_URL}/api/states`, {
      headers: {
        Authorization: `Bearer ${HOME_ASSISTANT_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    res.json(response.data); // Return devices from Home Assistant
  } catch (error) {
    console.error(
      "❌ Error fetching devices from Home Assistant:",
      error.message
    );
    res.status(500).json({ error: "Failed to fetch devices" });
  }
}

// **Sync Devices with MongoDB**
async function syncDevices(req, res) {
  try {
    const response = await axios.get(`${HOME_ASSISTANT_URL}/api/states`, {
      headers: {
        Authorization: `Bearer ${HOME_ASSISTANT_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    const devicesFromHA = response.data.map((device) => device.entity_id);
    const allStoredDevices = await Devices.find();

    for (const haDevice of response.data) {
      const existingDevice = await Devices.findOne({
        deviceId: haDevice.entity_id,
      });

      await Devices.findOneAndUpdate(
        { deviceId: haDevice.entity_id },
        {
          name: haDevice.attributes.friendly_name || "Unknown Device",
          type: haDevice.attributes.device_class || "Unknown",
          attributes: haDevice.attributes,
          position: existingDevice
            ? existingDevice.position
            : { x: null, y: null },
          placed: existingDevice ? existingDevice.placed : false,
          removed: false, // Reset removed flag if device is found again
        },
        { upsert: true, new: true }
      );
    }

    // Mark devices that no longer exist in Home Assistant as removed
    for (const storedDevice of allStoredDevices) {
      if (!devicesFromHA.includes(storedDevice.deviceId)) {
        await Devices.findOneAndUpdate(
          { deviceId: storedDevice.deviceId },
          { removed: true }
        );
        console.log(`⚠️ Device marked as removed: ${storedDevice.deviceId}`);
      }
    }

    res.json({
      message: "✅ Devices synced successfully",
      count: devicesFromHA.length,
    });
  } catch (error) {
    console.error("❌ Error syncing devices:", error.message);
    res.status(500).json({ error: "Failed to sync devices" });
  }
}

// **Report State Change to Home Assistant**
async function reportState(req, res) {
  try {
    const { deviceId, state } = req.body;
    if (!deviceId || !state) {
      return res
        .status(400)
        .json({ error: "Invalid request. Missing deviceId or state." });
    }

    const response = await axios.post(
      `${HOME_ASSISTANT_URL}/api/states/${deviceId}`,
      { state },
      {
        headers: {
          Authorization: `Bearer ${HOME_ASSISTANT_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json({
      message: "✅ State reported successfully",
      response: response.data,
    });
  } catch (error) {
    console.error("❌ Error reporting state:", error.message);
    res.status(500).json({ error: "Failed to report device state" });
  }
}

// **Authentication Middleware (Ensures API Token is Set)**
function ensureAuthenticated(req, res, next) {
  if (!HOME_ASSISTANT_TOKEN) {
    return res
      .status(401)
      .json({ error: "Unauthorized: No Home Assistant token found" });
  }
  next();
}

// **Export Controller Functions**
module.exports = {
  getDevices,
  syncDevices,
  reportState,
  ensureAuthenticated,
};

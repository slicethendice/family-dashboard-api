const express = require("express");
const router = express.Router();
const {
  getDevices,
  syncDevices, // Now properly imported
  ensureAuthenticated,
} = require("../controllers/smarthomeController");
const Device = require("../models/Devices");

require("dotenv").config();

router.use(ensureAuthenticated); // Ensure token is valid before API calls

// Fetch devices
router.get("/devices", getDevices);

// Fetch only placed devices for the map
router.get("/placed-devices", async (req, res) => {
  try {
    const placedDevices = await Device.find({ placed: true });
    res.json(placedDevices);
  } catch (error) {
    console.error("Error fetching placed devices:", error);
    res.status(500).json({ error: "Failed to fetch placed devices" });
  }
});

// Fetch device positions for admin settings
router.get("/device-positions", async (req, res) => {
  try {
    const positions = await Device.find(
      {},
      { deviceId: 1, position: 1, placed: 1 }
    );
    res.json(positions);
  } catch (error) {
    console.error("Error fetching positions:", error);
    res.status(500).json({ error: "Failed to fetch device positions" });
  }
});

// Update device placement
router.post("/device-positions", async (req, res) => {
  try {
    const { deviceId, x, y } = req.body;

    if (!deviceId || typeof x !== "number" || typeof y !== "number") {
      return res.status(400).json({ error: "Invalid input data" });
    }

    const updatedDevice = await Device.findOneAndUpdate(
      { deviceId },
      { position: { x, y }, placed: true },
      { new: true, upsert: true }
    );

    res.json({ message: "Device position updated", device: updatedDevice });
  } catch (error) {
    console.error("Error updating device position:", error);
    res.status(500).json({ error: "Failed to update position" });
  }
});

// Sync devices (Now correctly linked to `syncDevices`)
router.get("/sync", syncDevices);

module.exports = router;

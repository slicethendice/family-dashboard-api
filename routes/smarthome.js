const express = require("express");
const router = express.Router();
const {
  getDevices,
  syncDevices,
  reportState,
  ensureAuthenticated,
} = require("../controllers/smarthomeController");
const Devices = require("../models/Devices");

require("dotenv").config();

router.use(ensureAuthenticated); // Ensure API token is present

// **Sync Devices with Home Assistant and Store in MongoDB**
router.get("/sync-devices", syncDevices);

// **Fetch All Devices (Live from Home Assistant)**
router.get("/devices", getDevices);

// **Fetch Only Placed Devices (From MongoDB)**
router.get("/placed-devices", async (req, res) => {
  try {
    const placedDevices = await Devices.find({ placed: true, removed: false });
    res.json(placedDevices);
  } catch (error) {
    console.error("❌ Error fetching placed devices:", error.message);
    res.status(500).json({ error: "Failed to fetch placed devices" });
  }
});

// **Fetch Removed Devices**
router.get("/removed-devices", async (req, res) => {
  try {
    const removedDevices = await Devices.find({ removed: true });
    res.json(removedDevices);
  } catch (error) {
    console.error("❌ Error fetching removed devices:", error.message);
    res.status(500).json({ error: "Failed to fetch removed devices" });
  }
});

// **Update Device Placement**
router.post("/device-positions", async (req, res) => {
  try {
    const { deviceId, x, y } = req.body;

    if (!deviceId || typeof x !== "number" || typeof y !== "number") {
      return res.status(400).json({ error: "Invalid input data" });
    }

    const updatedDevice = await Devices.findOneAndUpdate(
      { deviceId },
      { position: { x, y }, placed: true },
      { new: true, upsert: true }
    );

    res.json({ message: "✅ Device position updated", device: updatedDevice });
  } catch (error) {
    console.error("❌ Error updating device position:", error.message);
    res.status(500).json({ error: "Failed to update position" });
  }
});

// **Report Device State Change to Home Assistant**
router.post("/report-state", reportState);

// **Manually Remove a Device (Permanently)**
router.delete("/remove-device/:deviceId", async (req, res) => {
  try {
    const { deviceId } = req.params;
    await Devices.deleteOne({ deviceId, removed: true });
    res.json({ message: `✅ Device ${deviceId} permanently deleted` });
  } catch (error) {
    console.error("❌ Error deleting device:", error.message);
    res.status(500).json({ error: "Failed to delete device" });
  }
});

module.exports = router;

const express = require("express");
const {
  controlDevice,
  getDeviceStatus,
  getDevices,
  syncDevices,
  reportState,
  ensureAuthenticated,
} = require("../controllers/smarthomeController");
const Devices = require("../models/Devices");

const router = express.Router();

router.use(ensureAuthenticated);

router.get("/sync-devices", syncDevices);
router.get("/devices", getDevices);
router.get("/devices/:deviceId/status", getDeviceStatus);
router.post("/devices/:deviceId/state", controlDevice);

router.get("/placed-devices", async (req, res) => {
  try {
    const placedDevices = await Devices.find({ placed: true, removed: false });
    res.json(placedDevices);
  } catch (error) {
    console.error("Error fetching placed devices:", error.message);
    res.status(500).json({ error: "Failed to fetch placed devices" });
  }
});

router.get("/removed-devices", async (req, res) => {
  try {
    const removedDevices = await Devices.find({ removed: true });
    res.json(removedDevices);
  } catch (error) {
    console.error("Error fetching removed devices:", error.message);
    res.status(500).json({ error: "Failed to fetch removed devices" });
  }
});

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

    res.json({ message: "Device position updated", device: updatedDevice });
  } catch (error) {
    console.error("Error updating device position:", error.message);
    res.status(500).json({ error: "Failed to update position" });
  }
});

// Backwards-compatible endpoint for existing clients.
router.post("/report-state", reportState);

router.delete("/remove-device/:deviceId", async (req, res) => {
  try {
    await Devices.deleteOne({
      deviceId: req.params.deviceId,
      removed: true,
    });
    res.json({ message: "Device permanently deleted" });
  } catch (error) {
    console.error("Error deleting device:", error.message);
    res.status(500).json({ error: "Failed to delete device" });
  }
});

module.exports = router;

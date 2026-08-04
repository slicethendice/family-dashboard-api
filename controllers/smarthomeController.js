const axios = require("axios");
const Devices = require("../models/Devices");

function getHomeAssistantConfig() {
  return {
    url: (process.env.HOME_ASSISTANT_URL || "").replace(/\/$/, ""),
    token: process.env.HOME_ASSISTANT_TOKEN,
  };
}

function createHomeAssistantClient() {
  const { url, token } = getHomeAssistantConfig();

  return axios.create({
    baseURL: `${url}/api`,
    timeout: 15000,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
}

function ensureAuthenticated(req, res, next) {
  const { url, token } = getHomeAssistantConfig();

  if (!url || !token) {
    return res.status(503).json({
      error: "Home Assistant is not configured",
    });
  }

  next();
}

async function getDevices(req, res) {
  try {
    const response = await createHomeAssistantClient().get("/states");
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching Home Assistant devices:", error.message);
    res.status(error.response?.status || 502).json({
      error: "Failed to fetch devices",
    });
  }
}

async function getDeviceStatus(req, res) {
  try {
    const response = await createHomeAssistantClient().get(
      `/states/${req.params.deviceId}`
    );
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching Home Assistant device:", error.message);
    res.status(error.response?.status || 502).json({
      error: "Failed to fetch device status",
    });
  }
}

async function controlDevice(req, res) {
  const { deviceId } = req.params;
  const { state, brightness } = req.body;

  if (!["on", "off"].includes(state)) {
    return res.status(400).json({ error: "State must be 'on' or 'off'" });
  }

  if (
    brightness !== undefined &&
    (!Number.isFinite(brightness) || brightness < 0 || brightness > 100)
  ) {
    return res.status(400).json({
      error: "Brightness must be a number between 0 and 100",
    });
  }

  const [domain] = deviceId.split(".");
  if (!domain || !deviceId.includes(".")) {
    return res.status(400).json({
      error: "Device ID must be a Home Assistant entity ID",
    });
  }

  try {
    const payload = {
      entity_id: deviceId,
      ...(state === "on" && brightness !== undefined
        ? { brightness_pct: brightness }
        : {}),
    };

    await createHomeAssistantClient().post(
      `/services/${domain}/turn_${state}`,
      payload
    );

    const status = await createHomeAssistantClient().get(
      `/states/${deviceId}`
    );
    res.json(status.data);
  } catch (error) {
    console.error("Error controlling Home Assistant device:", error.message);
    res.status(error.response?.status || 502).json({
      error: "Failed to control device",
    });
  }
}

async function syncDevices(req, res) {
  try {
    const response = await createHomeAssistantClient().get("/states");
    const devicesFromHomeAssistant = response.data.map(
      (device) => device.entity_id
    );
    const storedDevices = await Devices.find();

    for (const device of response.data) {
      const existingDevice = await Devices.findOne({
        deviceId: device.entity_id,
      });

      await Devices.findOneAndUpdate(
        { deviceId: device.entity_id },
        {
          name: device.attributes.friendly_name || device.entity_id,
          type: device.attributes.device_class || "unknown",
          attributes: device.attributes,
          position: existingDevice?.position || { x: null, y: null },
          placed: existingDevice?.placed || false,
          removed: false,
        },
        { upsert: true, new: true }
      );
    }

    for (const device of storedDevices) {
      if (!devicesFromHomeAssistant.includes(device.deviceId)) {
        await Devices.findOneAndUpdate(
          { deviceId: device.deviceId },
          { removed: true }
        );
      }
    }

    res.json({
      message: "Devices synced successfully",
      count: devicesFromHomeAssistant.length,
    });
  } catch (error) {
    console.error("Error syncing Home Assistant devices:", error.message);
    res.status(error.response?.status || 502).json({
      error: "Failed to sync devices",
    });
  }
}

async function reportState(req, res) {
  req.params.deviceId = req.body.deviceId;
  return controlDevice(req, res);
}

module.exports = {
  controlDevice,
  getDeviceStatus,
  getDevices,
  syncDevices,
  reportState,
  ensureAuthenticated,
};

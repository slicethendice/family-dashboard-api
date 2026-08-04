const mongoose = require("mongoose");

const DeviceSchema = new mongoose.Schema({
  deviceId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  type: { type: String, required: true },
  position: {
    x: { type: Number, default: null },
    y: { type: Number, default: null },
  },
  placed: { type: Boolean, default: false },
  attributes: { type: Object, default: {} },
  removed: { type: Boolean, default: false }, // Flag to track removed devices
});

module.exports = mongoose.model("Devices", DeviceSchema); // ✅ Ensure this matches the import

const mongoose = require("mongoose");

const WeatherSettingsSchema = new mongoose.Schema({
  location: {
    city: { type: String, required: true },
    lat: { type: Number, default: null },
    lon: { type: Number, default: null },
  },
  units: {
    type: String,
    enum: ["imperial", "metric"],
    default: "imperial",
  },
});

const CalendarSettingsSchema = new mongoose.Schema({
  defaultView: {
    type: String,
    enum: ["dayGridMonth", "dayGridWeek", "dayGridDay"],
    default: "dayGridMonth",
  },
  calendarsSynced: [
    {
      id: { type: String, required: true },
      name: { type: String, required: true },
      color: { type: String, required: true },
      isDefault: { type: Boolean, default: false },
    },
  ],
});

const SettingsSchema = new mongoose.Schema(
  {
    settings: {
      weatherSettings: WeatherSettingsSchema,
      calendarSettings: CalendarSettingsSchema,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Settings", SettingsSchema);

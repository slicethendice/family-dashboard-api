// controller/settingsController.js

const Settings = require("../models/Settings");

exports.getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings({
        settings: {
          weatherSettings: {
            location: { city: "Default City", lat: null, lon: null },
            units: "imperial",
          },
          calendarSettings: {
            defaultView: "dayGridMonth",
            calendarsSynced: [],
          },
        },
      });
      await settings.save();
    }
    res.json(settings.settings);
  } catch (err) {
    console.error("Error fetching settings:", err);
    res.status(500).json({ message: "Error fetching settings", error: err });
  }
};

exports.updateSettings = async (req, res) => {
  const { settings } = req.body;

  try {
    let appSettings = await Settings.findOne();
    if (appSettings) {
      appSettings.settings = settings;
    } else {
      appSettings = new Settings({ settings });
    }
    await appSettings.save();
    res.json({
      message: "Settings saved successfully",
      settings: appSettings.settings,
    });
  } catch (err) {
    console.error("Error saving settings:", err);
    res.status(500).json({ message: "Error saving settings", error: err });
  }
};

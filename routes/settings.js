const express = require("express");
const router = express.Router();
const settingsController = require("../controllers/settingsController");

router.get("/", (req, res) => {
  console.log("Fetching global settings");
  settingsController.getSettings(req, res);
});

router.post("/", (req, res) => {
  console.log("Updating global settings");
  console.log("New settings:", req.body);
  settingsController.updateSettings(req, res);
});

module.exports = router;

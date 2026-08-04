// routes/index.js

const express = require("express");
const router = express.Router();

const settingsRoutes = require("./settings");
const tasksRoutes = require("./tasks");
const calendarsRoutes = require("./calendars");
const usersRoutes = require("./users");
const { router: authRoutes } = require("./auth");
const smarthomeRoutes = require("./smarthome");

router.use("/settings", settingsRoutes);
router.use("/tasks", tasksRoutes);
router.use("/calendars", calendarsRoutes);
router.use("/auth", authRoutes);
router.use("/users", usersRoutes);
router.use("/smarthome", smarthomeRoutes);

module.exports = router;

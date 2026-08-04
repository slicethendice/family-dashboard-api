const express = require("express");

const router = express.Router();

const settingsRoutes = require("./settings");
const tasksRoutes = require("./tasks");
const calendarsRoutes = require("./calendars");
const usersRoutes = require("./users");
const { router: authRoutes } = require("./auth");
const smarthomeRoutes = require("./smarthome");
const weatherRoutes = require("./weather");
const newsRoutes = require("./news");

router.use("/settings", settingsRoutes);
router.use("/tasks", tasksRoutes);
router.use("/calendars", calendarsRoutes);
router.use("/auth", authRoutes);
router.use("/users", usersRoutes);
router.use("/smarthome", smarthomeRoutes);
router.use("/weather", weatherRoutes);
router.use("/news", newsRoutes);

module.exports = router;

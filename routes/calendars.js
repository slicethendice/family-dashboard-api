const express = require("express");
const calendarsController = require("../controllers/calendarsController");

const router = express.Router();

router.get("/", calendarsController.getCalendars);
router.post("/selections", calendarsController.updateCalendarSelections);
router.get("/:calendarId/events", calendarsController.getEvents);

module.exports = router;

const express = require("express");
const router = express.Router();
const calendarsController = require("../controllers/calendarsController"); // Correct path

// Route to get all calendars for the authenticated user
router.get("/", calendarsController.getCalendars);
router.get("/:userId", calendarsController.getCalendarsByUserId); // NEW ROUTE
router.post("/selections", calendarsController.updateCalendarSelections);
router.get("/:calendarId/events", calendarsController.getEvents);

module.exports = router;

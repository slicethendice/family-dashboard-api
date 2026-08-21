const Calendar = require("../models/Calendar");
const { palette } = require("../config/colors");
const { getCalendarClient } = require("../config/googleCalendar");

async function listServiceAccountCalendars(calendarClient) {
  const calendars = [];
  let pageToken;

  do {
    const response = await calendarClient.calendarList.list({
      maxResults: 250,
      pageToken,
    });
    calendars.push(...(response.data.items || []));
    pageToken = response.data.nextPageToken;
  } while (pageToken);

  return calendars;
}

async function listCalendarEvents(calendarClient, calendarId, timeMin, timeMax) {
  const events = [];
  let pageToken;

  do {
    const response = await calendarClient.events.list({
      calendarId,
      timeMin,
      timeMax,
      maxResults: 2500,
      pageToken,
      singleEvents: true,
      orderBy: "startTime",
    });
    events.push(...(response.data.items || []));
    pageToken = response.data.nextPageToken;
  } while (pageToken);

  return events;
}

function parseEventRange(query) {
  const { timeMin, timeMax } = query;
  const start = new Date(timeMin);
  const end = new Date(timeMax);

  if (
    !timeMin ||
    !timeMax ||
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    start >= end
  ) {
    const error = new Error(
      "timeMin and timeMax must be valid ISO dates and timeMin must precede timeMax"
    );
    error.status = 400;
    throw error;
  }

  const maximumRangeMs = 366 * 24 * 60 * 60 * 1000;
  if (end - start > maximumRangeMs) {
    const error = new Error("Calendar event ranges cannot exceed 366 days");
    error.status = 400;
    throw error;
  }

  return { timeMin: start.toISOString(), timeMax: end.toISOString() };
}

async function discoverCalendars() {
  const calendarClient = getCalendarClient();
  const existingCalendars = await Calendar.find();
  const existingByGoogleId = new Map(
    existingCalendars.map((calendar) => [calendar.googleId, calendar])
  );
  const discoveredByGoogleId = new Map();

  const visibleCalendars = await listServiceAccountCalendars(calendarClient);
  visibleCalendars.forEach((calendar) => {
    discoveredByGoogleId.set(calendar.id, {
      googleId: calendar.id,
      name: calendar.summary || "Unnamed Calendar",
      color: calendar.backgroundColor,
      accessRole: calendar.accessRole,
    });
  });

  const storedOnlyIds = existingCalendars
    .map((calendar) => calendar.googleId)
    .filter((calendarId) => !discoveredByGoogleId.has(calendarId));

  const storedResults = await Promise.allSettled(
    storedOnlyIds.map(async (calendarId) => {
      const response = await calendarClient.calendars.get({ calendarId });
      return {
        googleId: calendarId,
        name: response.data.summary || "Unnamed Calendar",
      };
    })
  );

  storedResults.forEach((result) => {
    if (result.status === "fulfilled") {
      discoveredByGoogleId.set(result.value.googleId, result.value);
    }
  });

  const savedCalendars = [];
  let colorIndex = 0;

  for (const discovered of discoveredByGoogleId.values()) {
    const existing = existingByGoogleId.get(discovered.googleId);
    const saved = await Calendar.findOneAndUpdate(
      { googleId: discovered.googleId },
      {
        $set: {
          name: discovered.name,
          color:
            discovered.color ||
            existing?.color ||
            palette[colorIndex % palette.length],
          accessRole:
            discovered.accessRole || existing?.accessRole || "reader",
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    savedCalendars.push(saved);
    colorIndex += 1;
  }

  return savedCalendars;
}

const calendarController = {
  getCalendars: async (req, res) => {
    try {
      const calendars = await discoverCalendars();
      res.json(
        calendars.map((calendar) => ({
          _id: calendar._id,
          id: calendar.googleId,
          googleId: calendar.googleId,
          name: calendar.name,
          color: calendar.color,
          accessRole: calendar.accessRole,
          selected: calendar.selected,
        }))
      );
    } catch (error) {
      console.error("Error fetching calendars:", error);
      res.status(502).json({
        message: "Error fetching calendars from Google",
        details: error.message,
      });
    }
  },

  getEvents: async (req, res) => {
    try {
      const { calendarId } = req.params;
      const { timeMin, timeMax } = parseEventRange(req.query);
      const storedCalendar = await Calendar.findOne({ googleId: calendarId });

      if (!storedCalendar) {
        return res.status(404).json({ message: "Calendar not found" });
      }

      const calendarClient = getCalendarClient();
      const events = await listCalendarEvents(
        calendarClient,
        calendarId,
        timeMin,
        timeMax
      );

      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(error.status || (error.code === 403 ? 403 : 502)).json({
        message:
          error.status === 400
            ? error.message
            : "Error fetching events from Google",
        details: error.status === 400 ? undefined : error.message,
      });
    }
  },

  updateCalendarSelections: async (req, res) => {
    try {
      const calendars = Array.isArray(req.body.calendars)
        ? req.body.calendars
        : [];

      await Promise.all(
        calendars
          .filter((calendar) => calendar._id)
          .map((calendar) =>
            Calendar.findByIdAndUpdate(calendar._id, {
              selected: Boolean(calendar.selected),
            })
          )
      );

      res.json({ message: "Selections updated successfully" });
    } catch (error) {
      console.error("Error updating calendar selections:", error);
      res.status(500).json({ message: "Failed to update calendar selections" });
    }
  },
};

module.exports = calendarController;
module.exports.listCalendarEvents = listCalendarEvents;
module.exports.parseEventRange = parseEventRange;

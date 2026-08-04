const { google } = require("googleapis");
const User = require("../models/User");
const Calendar = require("../models/Calendar");
const { colorPalette } = require("../config/colors");

const calendarController = {
  getCalendars: async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const user = await User.findOne({ googleId: req.user.googleId });

      if (!user || !user.accessToken) {
        return res
          .status(401)
          .json({ message: "Access token not found, please re-authenticate" });
      }

      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.CALLBACK_URL
      );
      oauth2Client.setCredentials({
        access_token: user.accessToken,
        refresh_token: user.refreshToken,
      });

      const calendar = google.calendar({ version: "v3", auth: oauth2Client });
      const response = await calendar.calendarList.list();

      if (response.data && response.data.items) {
        // Fetch existing calendars for the user
        const existingCalendars = await Calendar.find({ user: user._id });

        // Create a map of existing calendar colors by Google ID
        const existingColorMap = {};
        existingCalendars.forEach((cal) => {
          existingColorMap[cal.googleId] = cal.color;
        });

        // Assign colors to new calendars
        const calendarsToSave = response.data.items.map((item, index) => {
          const color =
            existingColorMap[item.id] ||
            colorPalette[index % colorPalette.length]; // Wrap around palette if needed

          return {
            googleId: item.id,
            name: item.summary || "Unnamed Calendar", // Use default if summary is missing
            user: user._id,
            color,
            accessRole: item.accessRole,
          };
        });

        // Remove old calendars for this user
        await Calendar.deleteMany({ user: user._id });

        // Save new calendars to the database
        const savedCalendars = await Calendar.insertMany(calendarsToSave);

        // Prepare response for the frontend
        const calendarsForResponse = savedCalendars.map((calendar) => ({
          id: calendar.googleId,
          name: calendar.name,
          color: calendar.color,
          accessRole: calendar.accessRole,
        }));

        res.json(calendarsForResponse);
      } else {
        console.warn("No calendars found in Google API response");
        res.json([]);
      }
    } catch (error) {
      console.error("Error fetching calendars:", error);
      res
        .status(500)
        .json({ message: "Error fetching calendars", details: error.message });
    }
  },
  getEvents: async (req, res) => {
    try {
      const { calendarId } = req.params;

      // Retrieve the user's tokens (stored during authentication)
      const user = req.user; // Assuming req.user is populated
      if (!user) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.CALLBACK_URL
      );

      oauth2Client.setCredentials({
        access_token: user.accessToken,
        refresh_token: user.refreshToken,
      });

      const calendar = google.calendar({ version: "v3", auth: oauth2Client });

      // Fetch all events without time restrictions
      const response = await calendar.events.list({
        calendarId: calendarId, // ID of the calendar to fetch events from
        maxResults: 2500, // Adjust as needed; default is 2500
        singleEvents: true, // Ensure recurring events are expanded
        orderBy: "startTime", // Ensure chronological order
      });

      res.json(response.data.items); // Return the events
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Error fetching events" });
    }
  },
  getCalendarsByUserId: async (req, res) => {
    try {
      const userId = req.params.userId;

      let calendars;
      if (userId === "all") {
        // Fetch all calendars if userId is "all"
        calendars = await Calendar.find();
      } else {
        // Otherwise, fetch calendars for the specific user
        calendars = await Calendar.find({ user: userId });
      }

      res.json(calendars);
    } catch (error) {
      console.error("Error fetching calendars:", error);
      res.status(500).json({ message: "Error fetching calendars" });
    }
  },
  updateCalendarSelections: async (req, res) => {
    try {
      const { calendars } = req.body; // Array of calendars with updated `selected` field
      for (const calendar of calendars) {
        await Calendar.findByIdAndUpdate(calendar._id, {
          selected: calendar.selected,
        });
      }
      res.status(200).json({ message: "Selections updated successfully" });
    } catch (error) {
      console.error("Error updating calendar selections:", error);
      res.status(500).json({ message: "Failed to update calendar selections" });
    }
  },
};

module.exports = calendarController;

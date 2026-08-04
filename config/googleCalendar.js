const { google } = require("googleapis");

const calendarAuth = new google.auth.GoogleAuth({
  keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
});

function getCalendarClient() {
  return google.calendar({ version: "v3", auth: calendarAuth });
}

module.exports = { getCalendarClient };

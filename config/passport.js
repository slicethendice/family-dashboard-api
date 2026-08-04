const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const { google } = require("googleapis");
const User = require("../models/User");
const Calendar = require("../models/Calendar");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.CALLBACK_URL,
      accessType: "offline", // Required for refresh tokens
      prompt: "consent", // Ensures re-prompt for permissions
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Step 1: Find or create the user in the database
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
          user = new User({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
            accessToken,
            refreshToken: refreshToken || "",
          });
        } else {
          // Update tokens if user already exists
          user.accessToken = accessToken;
          if (refreshToken) {
            user.refreshToken = refreshToken;
          }
        }
        await user.save();

        // Step 2: Fetch and save user calendars
        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          process.env.CALLBACK_URL
        );
        oauth2Client.setCredentials({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        const calendar = google.calendar({ version: "v3", auth: oauth2Client });
        const response = await calendar.calendarList.list();

        if (response.data && response.data.items) {
          // Remove existing calendars for this user to avoid duplicates
          await Calendar.deleteMany({ user: user._id });

          // Map and insert new calendars into the database
          const calendarsToSave = response.data.items.map((item) => ({
            googleId: item.id,
            name: item.summary,
            user: user._id,
            color: item.backgroundColor,
            accessRole: item.accessRole,
          }));
          await Calendar.insertMany(calendarsToSave);
        }

        // Step 3: Complete the authentication process
        done(null, user);
      } catch (error) {
        console.error("Error during authentication or calendar sync:", error);
        done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.googleId);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findOne({ googleId: id });
    done(null, user);
  } catch (error) {
    console.error("Error during deserialization:", error);
    done(error, null);
  }
});

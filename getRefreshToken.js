const { google } = require("googleapis");
require("dotenv").config();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.CALLBACK_URL
);

const getAuthUrl = async () => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/homegraph"],
    prompt: "consent", // Forces refresh token generation
  });
  console.log("Authorize this app by visiting this URL:\n", authUrl);
};

const getRefreshToken = async (code) => {
  const { tokens } = await oauth2Client.getToken(code);
  console.log("Your Refresh Token:", tokens.refresh_token);
};

if (process.argv.length < 3) {
  getAuthUrl();
} else {
  getRefreshToken(process.argv[2]);
}

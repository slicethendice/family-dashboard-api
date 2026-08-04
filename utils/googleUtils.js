const { google } = require("googleapis");

async function getAccessToken() {
  try {
    // Authenticate with Google using the service account's key file
    const auth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      scopes: ["https://www.googleapis.com/auth/homegraph"], // Set to your actual scopes
    });

    const authClient = await auth.getClient();
    const accessTokenResponse = await authClient.getAccessToken();

    console.log("Success! Access token: ", accessTokenResponse.token);
    return accessTokenResponse.token;
  } catch (error) {
    console.error("Failed to get access token", error);
    throw error;
  }
}

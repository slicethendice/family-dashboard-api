// models/User.js

const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  googleId: { type: String, required: true },
  name: { type: String },
  email: { type: String, required: true },
  accessToken: { type: String, required: true },
  refreshToken: { type: String, required: false },
  tokenExpiry: {
    type: Date,
    required: false,
    default: () => new Date(Date.now() + 3600000), // Default to 1 hour from now
  },
});

module.exports = mongoose.model("User", UserSchema);

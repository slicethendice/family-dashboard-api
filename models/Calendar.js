const mongoose = require("mongoose");
const { Schema } = mongoose;

const calendarSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  googleId: { type: String, required: true, unique: true, index: true },
  selected: { type: Boolean, default: false },
  color: { type: String },
  accessRole: { type: String },
});

module.exports = mongoose.model("Calendar", calendarSchema);

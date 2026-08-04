const mongoose = require("mongoose");
const { Schema } = mongoose;

const calendarSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  description: { type: String },
  googleId: { type: String, required: true },
  selected: { type: Boolean, default: false },
  color: { type: String },
  accessRole: { type: String },
  selected: { type: Boolean, default: false },
});

const Calendar = mongoose.model("Calendar", calendarSchema);

module.exports = Calendar;

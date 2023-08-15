const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  nickname: { type: String, required: true },
  password: {
    type: String,
    required: true,
    trim: true,
    minLength: [6, "Must be at least 6, got {VALUE}"],
  },
  sendedMessages: [{ type: mongoose.Schema.Types.ObjectId, ref: "Message" }],
  receivedMessages: [{ type: mongoose.Schema.Types.ObjectId, ref: "Message" }],
});

module.exports = mongoose.model("User", userSchema);

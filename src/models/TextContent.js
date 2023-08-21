const mongoose = require("mongoose");

const textContentSchema = new mongoose.Schema({
  textContent: String,
});

const TextContent = mongoose.model("TextContent", textContentSchema);

module.exports = TextContent;

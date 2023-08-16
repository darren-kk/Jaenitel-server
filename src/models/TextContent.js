const mongoose = require("mongoose");

const textContentSchema = new mongoose.Schema({
  content: String,
});

const TextContent = mongoose.model("TextContent", textContentSchema);

module.exports = TextContent;

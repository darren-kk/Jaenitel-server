const mongoose = require("mongoose");

const imageContentSchema = new mongoose.Schema({
  imageContent: String,
});

const ImageContent = mongoose.model("ImageContent", imageContentSchema);

module.exports = ImageContent;

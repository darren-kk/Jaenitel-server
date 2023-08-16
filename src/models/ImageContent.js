const mongoose = require("mongoose");

const imageContentSchema = new mongoose.Schema({
  imageUrl: String,
});

const ImageContent = mongoose.model("ImageContent", imageContentSchema);

module.exports = ImageContent;

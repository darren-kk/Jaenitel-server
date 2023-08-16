const mongoose = require("mongoose");

const videoContentSchema = new mongoose.Schema({
  videoUrl: String,
});

const VideoContent = mongoose.model("VideoContent", videoContentSchema);

module.exports = VideoContent;

const mongoose = require("mongoose");

const videoContentSchema = new mongoose.Schema({
  videoContent: String,
});

const VideoContent = mongoose.model("VideoContent", videoContentSchema);

module.exports = VideoContent;

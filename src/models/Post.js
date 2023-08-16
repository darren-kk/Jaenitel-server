const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  title: String,
  category: String,
  madeBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  createdDate: {
    type: Date,
    default: Date.now,
  },
  contents: [
    {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "ContentType",
    },
  ],
});

postSchema.virtual("textContents", {
  ref: "TextContent",
  localField: "contents",
  foreignField: "_id",
});

postSchema.virtual("imageContents", {
  ref: "ImageContent",
  localField: "contents",
  foreignField: "_id",
});

postSchema.virtual("videoContents", {
  ref: "VideoContent",
  localField: "contents",
  foreignField: "_id",
});

const Post = mongoose.model("Post", postSchema);

module.exports = Post;

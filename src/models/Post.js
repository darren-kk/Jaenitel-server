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
      refPath: "contentModel",
    },
  ],
  contentModel: [
    {
      type: String,
    },
  ],
});

const Post = mongoose.model("Post", postSchema);

module.exports = Post;

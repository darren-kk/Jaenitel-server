const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  sendFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  sendTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
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
  read: {
    type: Boolean,
    default: false,
  },
  createdDate: {
    type: Date,
    default: Date.now,
  },
});

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;

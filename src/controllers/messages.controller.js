const { getS3Client, getDeleteObjectCommand, getPutObjectCommand } = require("../configs/s3Config");

const User = require("../models/User");
const Message = require("../models/Message");
const TextContent = require("../models/TextContent");
const ImageContent = require("../models/ImageContent");
const VideoContent = require("../models/VideoContent");

const CONFIG = require("../configs/index");

exports.getMessages = async (req, res, next) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User Not Found" });
    }

    const sendedMessageIds = user.sendedMessages;
    const receivedMessageIds = user.receivedMessages;

    const sendedMessages = await Promise.all(
      sendedMessageIds.map(async (message) => {
        return await Message.findById(message._id).populate("sendTo").populate("contents");
      }),
    );

    const receivedMessages = await Promise.all(
      receivedMessageIds.map(async (message) => {
        return await Message.findById(message._id).populate("contents");
      }),
    );

    const messages = { sendedMessages, receivedMessages };

    res.status(200).json({ messages });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

exports.getMessage = async (req, res, next) => {
  const { userId, messageId } = req.params;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User Not Found" });
    }

    const message = await Message.findById(messageId).populate("sendTo").populate("contents");

    if (!message) {
      return res.status(404).json({ error: "Message Not Found" });
    }

    message.read = true;

    await message.save();

    res.status(200).json({ message });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

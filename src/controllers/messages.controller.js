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

    const sendedMessagesToMap = await Message.find({ sendFrom: user._id })
      .sort("-createdDate")
      .populate("sendTo")
      .populate("contents");

    const receivedMessagesToMap = await Message.find({ sendTo: user._id })
      .sort("-createdDate")
      .populate("sendFrom")
      .populate("contents");

    const sendedMessages = sendedMessagesToMap.map((message, index) => {
      return {
        id: message._id,
        index: "m" + (sendedMessagesToMap.length - index),
        content: message.contents[0],
        nickname: message.sendTo.nickname,
      };
    });

    const receivedMessages = receivedMessagesToMap.map((message, index) => {
      return {
        id: message._id,
        index: receivedMessagesToMap.length - index,
        content: message.contents[0],
        nickname: message.sendFrom.nickname,
        read: message.read,
      };
    });

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

    const message = await Message.findById(messageId).populate("sendFrom").populate("sendTo").populate("contents");

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

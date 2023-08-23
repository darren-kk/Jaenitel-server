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

exports.createMessage = async (req, res, next) => {
  const { userId } = req.params;
  const s3Client = getS3Client();
  const contents = req.body.contents;

  try {
    const user = await User.findById(userId);
    const sendTo = await User.find({ nickname: req.body.sendTo });
    const uploadPromises = [];

    if (!user) {
      return res.status(404).json({ error: "User Not Found" });
    }

    if (!sendTo) {
      return res.status(404).json({ error: "Receiver Not Found" });
    }

    for (const file of req.files) {
      const indexPattern = /\[(\d+)\]/;
      const match = file.fieldname.match(indexPattern);
      const index = match ? parseInt(match[1], 10) : -1;

      if (file.fieldname.includes("imageContent")) {
        const id = new Date().toISOString();
        const fileName = `messages/${user._id}/${id}.png`;
        const putObjectCommand = getPutObjectCommand(CONFIG.AWS_S3_BUCKET_NAME, fileName, file.buffer, "image/png");
        const url = `https://${CONFIG.AWS_S3_BUCKET_NAME}.s3.${CONFIG.AWS_S3_REGION}.amazonaws.com/${fileName}`;
        const uploadPromise = s3Client.send(putObjectCommand);

        uploadPromises.push(uploadPromise);

        contents[index] = { imageContent: url };
      }

      if (file.fieldname.includes("videoContent")) {
        const id = new Date().toISOString();
        const fileName = `messages/${user._id}/${id}.mp4`;
        const putObjectCommand = getPutObjectCommand(CONFIG.AWS_S3_BUCKET_NAME, fileName, file.buffer, "video/mp4");
        const url = `https://${CONFIG.AWS_S3_BUCKET_NAME}.s3.${CONFIG.AWS_S3_REGION}.amazonaws.com/${fileName}`;
        const uploadPromise = s3Client.send(putObjectCommand);

        uploadPromises.push(uploadPromise);

        contents[index] = { videoContent: url };
      }
    }

    await Promise.all(uploadPromises);

    const savedContents = await Promise.all(
      contents.map(async (content) => {
        if (content.textContent) {
          const newTextContent = new TextContent({ textContent: content.textContent });

          await newTextContent.save();

          return newTextContent;
        }
        if (content.imageContent) {
          const newImageContent = new ImageContent({ imageContent: content.imageContent });

          await newImageContent.save();

          return newImageContent;
        }
        if (content.videoContent) {
          const newVideoContent = new VideoContent({ videoContent: content.videoContent });

          await newVideoContent.save();

          return newVideoContent;
        }
      }),
    );

    const newMessage = new Message({
      sendFrom: user._id,
      sendTo: sendTo._id,
      contents: savedContents,
      contentModel: ["TextContent", "ImageContent", "VideoContent"],
    });

    await newMessage.save();

    user.sendedMessages.push(newMessage._id);

    sendTo.receivedMessages.push(newMessage._id);

    await user.save();
    await sendTo.save();

    res.status(201).json({ success: true });
  } catch (error) {
    next(error);
  }
};

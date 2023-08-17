const { getS3Client, getListObjectsCommand, getPutObjectCommand } = require("../configs/s3Config");

const User = require("../models/User");
const TextContent = require("../models/TextContent");
const ImageContent = require("../models/ImageContent");
const VideoContent = require("../models/VideoContent");
const Post = require("../models/Post");

const CONFIG = require("../configs/index");

exports.getPosts = async (req, res, next) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User Not Found" });
    }

    const posts = await Post.find({ madeBy: user._id });

    res.status(200).json({ posts });
  } catch (error) {
    next(error);
  }
};

exports.createPost = async (req, res, next) => {
  const { userId } = req.params;
  const s3Client = getS3Client();
  const contents = req.body.contents;

  try {
    const user = await User.findById(userId);
    const uploadPromises = [];

    if (!user) {
      return res.status(404).json({ error: "User Not Found" });
    }

    for (const file of req.files) {
      const indexPattern = /\[(\d+)\]/;
      const match = file.fieldname.match(indexPattern);
      const index = match ? parseInt(match[1], 10) : -1;

      if (file.fieldname.includes("imageContent")) {
        const id = new Date().toISOString();
        const fileName = `posts/${user._id}/${id}.png`;
        const putObjectCommand = getPutObjectCommand(CONFIG.AWS_S3_BUCKET_NAME, fileName, file.buffer, "image/png");
        const url = `https://${CONFIG.AWS_S3_BUCKET_NAME}.s3.${CONFIG.AWS_S3_REGION}.amazonaws.com/${fileName}`;
        const uploadPromise = s3Client.send(putObjectCommand);

        uploadPromises.push(uploadPromise);

        contents[index] = { imageContent: url };
      }

      if (file.fieldname.includes("videoContent")) {
        const id = new Date().toISOString();
        const fileName = `posts/${user._id}/${id}.mp4`;
        const putObjectCommand = getPutObjectCommand(CONFIG.AWS_S3_BUCKET_NAME, fileName, file.buffer, "video/mp4");
        const url = `https://${CONFIG.AWS_S3_BUCKET_NAME}.s3.${CONFIG.AWS_S3_REGION}.amazonaws.com/${fileName}`;
        const uploadPromise = s3Client.send(putObjectCommand);

        uploadPromises.push(uploadPromise);

        contents[index] = { videoContent: url };
      }
    }

    await Promise.all(uploadPromises);

    const savedContents = await Promise.all(
      contents.map((content) => {
        if (content.textContent) {
          return new TextContent({ content: content.textContent });
        }
        if (content.imageContent) {
          return new ImageContent({ content: content.imageContent });
        }
        if (content.videoContent) {
          return new VideoContent({ content: content.videoContent });
        }
      }),
    );

    const newPost = new Post({
      title: req.body.title,
      category: req.body.category,
      madeBy: user._id,
      contents: savedContents,
    });

    await newPost.save();

    res.status(201).json({ success: true });
  } catch (error) {
    next(error);
  }
};

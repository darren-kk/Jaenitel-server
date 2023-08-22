const { getS3Client, getListObjectsCommand, getPutObjectCommand } = require("../configs/s3Config");

const User = require("../models/User");
const TextContent = require("../models/TextContent");
const ImageContent = require("../models/ImageContent");
const VideoContent = require("../models/VideoContent");
const Post = require("../models/Post");

const CONFIG = require("../configs/index");

exports.getPosts = async (req, res, next) => {
  const { userId } = req.params;
  const { category, page, limit } = req.query;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User Not Found" });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const totalPosts = await Post.countDocuments({ category: category });
    const posts = await Post.find({ category: category })
      .populate("madeBy")
      .populate("contents")
      .sort("-createdDate")
      .skip(skip)
      .limit(parseInt(limit));

    const postsWithIndex = posts.map((post, index) => {
      return {
        _id: post._id,
        title: post.title,
        madeBy: post.madeBy,
        createdDate: post.createdDate,
        index: totalPosts - (skip + index),
      };
    });

    res.status(200).json({
      posts: postsWithIndex,
      totalPages: Math.ceil(totalPosts / parseInt(limit)),
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

exports.getPost = async (req, res, next) => {
  const { userId, postId } = req.params;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User Not Found" });
    }

    const post = await Post.findById(postId).populate("madeBy").populate("contents");

    if (!post) {
      return res.status(404).json({ error: "Post Not Found" });
    }

    res.status(200).json({ post });
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

    const newPost = new Post({
      title: req.body.title,
      category: req.body.category,
      madeBy: user._id,
      contents: savedContents,
      contentModel: ["TextContent", "ImageContent", "VideoContent"],
    });

    await newPost.save();

    res.status(201).json({ success: true });
  } catch (error) {
    next(error);
  }
};

exports.editPost = async (req, res, next) => {
  const { userId, postId } = req.params;
  const s3Client = getS3Client();
  const updates = req.body;

  try {
    const user = await User.findById(userId);
    const post = await Post.findById(postId).populate("contents");

    if (!user) {
      return res.status(404).json({ error: "User Not Found" });
    }

    if (!post) {
      return res.status(404).json({ error: "Post Not Found" });
    }

    if (user._id.toString() !== post.madeBy.toString()) {
      return res.status(400).json({ error: "수정 권한이 없습니다!" });
    }

    const contents = req.body.contents;
    const uploadPromises = [];
    const oldContentsToDelete = [];

    if (req.files) {
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
    }

    const savedContents = await Promise.all(
      contents.map(async (content, index) => {
        const existingContent = post.contents[index];

        if (content.textContent) {
          if (existingContent && existingContent.textContent === content.textContent) {
            return existingContent;
          }

          const newTextContent = new TextContent({ textContent: content.textContent });
          await newTextContent.save();
          if (existingContent) {
            oldContentsToDelete.push(existingContent._id);
          }

          return newTextContent;
        }

        if (content.imageContent) {
          if (existingContent) {
            existingContent.imageContent = content.imageContent;

            await existingContent.save();

            return existingContent;
          }

          const newImageContent = new ImageContent({ imageContent: content.imageContent });
          await newImageContent.save();
          if (existingContent) {
            oldContentsToDelete.push(existingContent);
          }

          return newImageContent;
        }

        if (content.videoContent) {
          if (existingContent) {
            existingContent.videoContent = content.videoContent;

            await existingContent.save();

            return existingContent;
          }

          const newVideoContent = new VideoContent({ videoContent: content.videoContent });
          await newVideoContent.save();
          if (existingContent) {
            oldContentsToDelete.push(existingContent._id);
          }

          return newVideoContent;
        }
      }),
    );

    post.title = updates.title;
    post.category = updates.category;
    post.contents = savedContents;

    await post.save();

    await Promise.all(
      oldContentsToDelete.map((existingContent) => {
        if (existingContent.textContent) {
          return TextContent.findByIdAndDelete(existingContent._id);
        }
        if (existingContent.imageContent) {
          return ImageContent.findByIdAndDelete(existingContent._id);
        }
        if (existingContent.videoContent) {
          return VideoContent.findByIdAndDelete(existingContent._id);
        }
      }),
    );

    res.status(200).json({ succes: true });
  } catch (error) {
    next(error);
  }
};

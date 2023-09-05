const { getS3Client, getDeleteObjectCommand, getPutObjectCommand } = require("../configs/s3Config");

const User = require("../models/User");
const TextContent = require("../models/TextContent");
const ImageContent = require("../models/ImageContent");
const VideoContent = require("../models/VideoContent");
const Post = require("../models/Post");

const getContentType = require("../utils/getContentType");

const CONFIG = require("../configs/index");

exports.getPosts = async (req, res, next) => {
  const { userId } = req.params;
  const { category, page, limit } = req.query;

  try {
    const user = await User.findById(userId);

    if (!user) {
      const error = new Error("존재하지 않는 사용자 입니다.");
      error.status = 404;

      next(error);
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
    error.status = 500;
    error.message = "Internal Server Error";

    next(error);
  }
};

exports.getPost = async (req, res, next) => {
  const { userId, postId } = req.params;

  try {
    const user = await User.findById(userId);

    if (!user) {
      const error = new Error("존재하지 않는 사용자 입니다.");
      error.status = 404;

      next(error);
    }

    const targetPost = await Post.findById(postId).populate("madeBy");

    if (!targetPost) {
      const error = new Error("존재하지 않는 게시글 입니다.");
      error.status = 404;

      next(error);
    }

    const fetchContentFromModels = async function (contentId) {
      const models = [TextContent, ImageContent, VideoContent];

      for (const model of models) {
        const content = await model.findById(contentId);

        if (content) {
          return content;
        }
      }
      return null;
    };

    const populatedContents = [];

    for (const contentId of targetPost.contents) {
      const content = await fetchContentFromModels(contentId);

      populatedContents.push(content);
    }

    const post = {
      _id: targetPost._id,
      title: targetPost.title,
      category: targetPost.category,
      madeBy: targetPost.madeBy,
      createdDate: targetPost.createdDate,
      contents: populatedContents,
    };

    res.status(200).json({ post });
  } catch (error) {
    error.status = 500;
    error.message = "Internal Server Error";

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
      const error = new Error("존재하지 않는 사용자 입니다.");
      error.status = 404;

      next(error);
    }

    for (const file of req.files) {
      const indexPattern = /\[(\d+)\]/;
      const match = file.fieldname.match(indexPattern);
      const index = match ? parseInt(match[1], 10) : -1;

      const { contentType, extension } = getContentType(file.originalname) || {};

      if (!contentType || !extension) {
        const error = new Error(`지원하지 않는 파일 확장자입니다.: ${file.originalname}`);
        error.status = 404;

        next(error);
      }

      const id = new Date().toISOString();
      const fileName = `posts/${user._id}/${id}${extension}`;
      const putObjectCommand = getPutObjectCommand(CONFIG.AWS_S3_BUCKET_NAME, fileName, file.buffer, contentType);
      const url = `https://${CONFIG.AWS_S3_BUCKET_NAME}.s3.${CONFIG.AWS_S3_REGION}.amazonaws.com/${fileName}`;
      const uploadPromise = s3Client.send(putObjectCommand);

      uploadPromises.push(uploadPromise);

      if (contentType.startsWith("image/")) {
        contents[index] = { imageContent: url };
      } else if (contentType.startsWith("video/")) {
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
    error.status = 500;
    error.message = "Internal Server Error";

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
      const error = new Error("존재하지 않는 사용자 입니다.");
      error.status = 404;

      next(error);
    }

    if (!post) {
      const error = new Error("존재하지 않는 게시글 입니다.");
      error.status = 404;

      next(error);
    }

    if (user._id.toString() !== post.madeBy.toString()) {
      const error = new Error("수정 권한이 없습니다!");
      error.status = 404;

      next(error);
    }

    const contents = req.body.contents;
    const uploadPromises = [];
    const oldContentsToDelete = [];

    if (req.files) {
      for (const file of req.files) {
        const indexPattern = /\[(\d+)\]/;
        const match = file.fieldname.match(indexPattern);
        const index = match ? parseInt(match[1], 10) : -1;

        const { contentType, extension } = getContentType(file.originalname) || {};

        if (!contentType || !extension) {
          const error = new Error(`지원하지 않는 파일 확장자입니다.: ${file.originalname}`);
          error.status = 404;

          next(error);
        }

        const id = new Date().toISOString();
        const fileName = `posts/${user._id}/${id}${extension}`;
        const putObjectCommand = getPutObjectCommand(CONFIG.AWS_S3_BUCKET_NAME, fileName, file.buffer, contentType);
        const url = `https://${CONFIG.AWS_S3_BUCKET_NAME}.s3.${CONFIG.AWS_S3_REGION}.amazonaws.com/${fileName}`;
        const uploadPromise = s3Client.send(putObjectCommand);

        uploadPromises.push(uploadPromise);

        if (contentType.startsWith("image/")) {
          contents[index] = { imageContent: url };
        } else if (contentType.startsWith("video/")) {
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

    res.status(200).json({ success: true });
  } catch (error) {
    error.status = 500;
    error.message = "Internal Server Error";

    next(error);
  }
};

exports.deletePost = async (req, res, next) => {
  const { userId, postId } = req.params;
  const s3Client = getS3Client();

  try {
    const user = await User.findById(userId);
    const post = await Post.findById(postId).populate("contents");

    if (!user) {
      const error = new Error("존재하지 않는 사용자 입니다.");
      error.status = 404;

      next(error);
    }

    if (!post) {
      const error = new Error("존재하지 않는 게시글 입니다.");
      error.status = 404;

      next(error);
    }

    await Promise.all(
      post.contents.map(async (content) => {
        if (content.textContent) {
          await TextContent.findByIdAndDelete(content._id);
        }
        if (content.imageContent) {
          const fileName = content.imageContent.split(".com/")[1];
          const deleteCmd = getDeleteObjectCommand(CONFIG.AWS_S3_BUCKET_NAME, fileName);

          await ImageContent.findByIdAndDelete(content._id);
          await s3Client.send(deleteCmd);
        }
        if (content.videoContent) {
          const fileName = content.videoContent.split(".com/")[1];
          const deleteCmd = getDeleteObjectCommand(CONFIG.AWS_S3_BUCKET_NAME, fileName);

          await VideoContent.findByIdAndDelete(content._id);
          await s3Client.send(deleteCmd);
        }
      }),
    );

    await Post.findByIdAndDelete(postId);

    res.status(200).json({ success: true });
  } catch (error) {
    error.status = 500;
    error.message = "Internal Server Error";

    next(error);
  }
};

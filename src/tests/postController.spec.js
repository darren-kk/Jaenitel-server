const request = require("supertest");
const app = require("../../app");
const User = require("../models/User");
const Post = require("../models/Post");
const TextContent = require("../models/TextContent");
const ImageContent = require("../models/ImageContent");
const VideoContent = require("../models/VideoContent");
const { getDeleteObjectCommand } = require("../configs/s3Config");

const mockFile = [
  {
    fieldname: "file[1][imageContent]",
    originalname: "test.jpg",
    buffer: Buffer.from("testImage"),
  },
  {
    fieldname: "file[2][videoContent]",
    originalname: "test.mp4",
    buffer: Buffer.from("testVideo"),
  },
];

let mockRequestBody = { title: "Test Post", category: "Test Category", contents: [{ textContent: "Test" }] };

jest.mock("multer", () => {
  const multer = () => ({
    any: () => {
      return (req, res, next) => {
        req.body = mockRequestBody;
        req.files = mockFile;
        return next();
      };
    },
  });
  multer.memoryStorage = () => jest.fn();
  return multer;
});

jest.mock("../configs/s3Config", () => ({
  getS3Client: jest.fn().mockReturnValue({
    send: jest.fn().mockResolvedValue(true),
  }),
  getPutObjectCommand: jest.fn(),
  getDeleteObjectCommand: jest.fn(),
}));

jest.mock("../middlewares/verifyToken");

const verifyToken = require("../middlewares/verifyToken");

describe.only("Post Controller", () => {
  beforeEach(async () => {
    await User.deleteMany({});
    await Post.deleteMany({});
    await TextContent.deleteMany({});
    await ImageContent.deleteMany({});
    await VideoContent.deleteMany({});
    mockRequestBody = { title: "Test Post", category: "Test Category", contents: [{ textContent: "Test" }] };
    global.CONFIG = {
      AWS_S3_BUCKET_NAME: "mockBucketName",
      AWS_S3_REGION: "mockRegion",
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should get posts", async () => {
    verifyToken.mockImplementation((req, res, next) => {
      req.user = {
        email: "test@gmail.com",
        password: "123456",
        nickname: "darren",
      };

      next();
    });

    const user = await User.create({ email: "test@gmail.com", password: "123456", nickname: "darren" });
    await Post.create({
      title: "testPost",
      category: "test",
      madeBy: user._id,
      createdDate: "2023-08-29T19:35:25.530+00:00",
    });

    const response = await request(app).get(`/users/${user._id}/posts`).query({
      category: "test",
      page: 1,
      limit: 10,
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("posts");
  });

  test("should get a single post", async () => {
    verifyToken.mockImplementation((req, res, next) => {
      req.user = {
        email: "test@gmail.com",
        password: "123456",
        nickname: "darren",
      };

      next();
    });

    const user = await User.create({ email: "test@gmail.com", password: "123456", nickname: "darren" });
    const post = await Post.create({
      title: "testPost",
      madeBy: user._id,
      createdDate: "2023-08-29T19:35:25.530+00:00",
    });

    const response = await request(app).get(`/users/${user._id}/posts/${post._id}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("post");
  });

  test("should create a post", async () => {
    verifyToken.mockImplementation((req, res, next) => {
      req.user = {
        email: "test@gmail.com",
        password: "123456",
        nickname: "darren",
      };

      next();
    });

    const user = await User.create({ email: "test@gmail.com", password: "123456", nickname: "darren" });
    const response = await request(app).post(`/users/${user._id}/posts`);

    expect(response.statusCode).toBe(201);
    expect(response.body.success).toBe(true);

    const post = await Post.findOne({ title: "Test Post" });
    expect(post).not.toBeNull();

    expect(post.contents).toHaveLength(3);
  });
  test("should handle errors when creating a post", async () => {
    verifyToken.mockImplementation((req, res, next) => {
      req.user = {
        email: "test@gmail.com",
        password: "123456",
        nickname: "darren",
      };

      next();
    });

    mockRequestBody = {};

    const user = await User.create({ email: "test@gmail.com", password: "123456", nickname: "darren" });
    const response = await request(app).post(`/users/${user._id}/posts`);

    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.error.text).message).toBe("Internal Server Error");
  });

  test("should edit a post", async () => {
    const user = await User.create({ email: "test@gmail.com", password: "123456", nickname: "darren" });
    const post = await Post.create({
      title: "testPost",
      madeBy: user._id,
      createdDate: "2023-08-29T19:35:25.530+00:00",
    });

    const response = await request(app).put(`/users/${user._id}/posts/${post._id}`).send({});

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test("should delete a post", async () => {
    const user = await User.create({ email: "test@gmail.com", password: "123456", nickname: "darren" });
    const imageContent = await ImageContent.create({ imageContent: "testImage.com" });
    const videoContent = await VideoContent.create({ videoContent: "testVideo.com" });
    const post = await Post.create({
      title: "testPost",
      madeBy: user._id,
      createdDate: "2023-08-29T19:35:25.530+00:00",
      contents: [imageContent._id, videoContent._id],
      contentModel: ["TextContent", "ImageContent", "VideoContent"],
    });

    const response = await request(app).delete(`/users/${user._id}/posts/${post._id}`);

    expect(getDeleteObjectCommand).toHaveBeenCalledTimes(2);
    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
  });
});

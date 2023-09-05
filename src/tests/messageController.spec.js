const request = require("supertest");
const app = require("../../app");
const User = require("../models/User");
const Message = require("../models/Message");
const TextContent = require("../models/TextContent");
const ImageContent = require("../models/ImageContent");
const VideoContent = require("../models/VideoContent");
const verifyToken = require("../middlewares/verifyToken");

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

let mockRequestBody;

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

describe("Message Controller", () => {
  beforeEach(async () => {
    await User.deleteMany({});
    await Message.deleteMany({});
    await TextContent.deleteMany({});
    await ImageContent.deleteMany({});
    await VideoContent.deleteMany({});
    mockRequestBody = { sendTo: "john", sendFrom: "darren", contents: [{ textContent: "Test" }] };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should get messages", async () => {
    verifyToken.mockImplementation((req, res, next) => {
      req.user = {
        email: "test@gmail.com",
        password: "123456",
        nickname: "darren",
      };

      next();
    });

    const user = await User.create({ email: "test@gmail.com", password: "123456", nickname: "darren" });
    const sendTo = await User.create({ email: "test2@gmail.com", password: "123456", nickname: "john" });

    await Message.create({
      sendFrom: user._id,
      sendTo: sendTo._id,
      createdDate: "2023-08-29T19:35:25.530+00:00",
    });
    await Message.create({
      sendFrom: sendTo._id,
      sendTo: user._id,
      createdDate: "2023-08-29T19:35:25.530+00:00",
    });

    const response = await request(app).get(`/users/${user._id}/messages`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("messages");
  });

  test("should get a single message", async () => {
    verifyToken.mockImplementation((req, res, next) => {
      req.user = {
        email: "test@gmail.com",
        password: "123456",
        nickname: "darren",
      };

      next();
    });

    const user = await User.create({ email: "test@gmail.com", password: "123456", nickname: "darren" });
    const sendTo = await User.create({ email: "test2@gmail.com", password: "123456", nickname: "john" });

    const message = await Message.create({
      sendFrom: user._id,
      sendTo: sendTo._id,
      createdDate: "2023-08-29T19:35:25.530+00:00",
    });

    const response = await request(app).get(`/users/${user._id}/messages/${message._id}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("message");
  });

  test("should create a message", async () => {
    verifyToken.mockImplementation((req, res, next) => {
      req.user = {
        email: "test@gmail.com",
        password: "123456",
        nickname: "darren",
      };

      next();
    });

    const user = await User.create({ email: "test@gmail.com", password: "123456", nickname: "darren" });
    const sendTo = await User.create({ email: "test2@gmail.com", password: "123456", nickname: "john" });
    const response = await request(app).post(`/users/${user._id}/messages`);

    expect(response.statusCode).toBe(201);
    expect(response.body.success).toBe(true);

    const message = await Message.findOne({ sendFrom: user._id });
    expect(message).not.toBeNull();

    expect(message.contents).toHaveLength(3);
  });

  test("should handle errors when creating a message without sendTo", async () => {
    verifyToken.mockImplementation((req, res, next) => {
      req.user = {
        email: "test@gmail.com",
        password: "123456",
        nickname: "darren",
      };

      next();
    });

    const user = await User.create({ email: "test@gmail.com", password: "123456", nickname: "darren" });
    const response = await request(app).post(`/users/${user._id}/messages`);

    expect(response.statusCode).toBe(404);
    expect(JSON.parse(response.error.text).message).toBe("해당 닉네임의 사용자가 존재하지 않습니다.");
  });

  test("should handle errors when creating a message without sendTo", async () => {
    verifyToken.mockImplementation((req, res, next) => {
      req.user = {
        email: "test@gmail.com",
        password: "123456",
        nickname: "darren",
      };

      next();
    });

    mockRequestBody = { sendTo: "john", sendFrom: "darren" };

    const user = await User.create({ email: "test@gmail.com", password: "123456", nickname: "darren" });
    const sendTo = await User.create({ email: "test2@gmail.com", password: "123456", nickname: "john" });
    const response = await request(app).post(`/users/${user._id}/messages`);

    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.error.text).message).toBe("Internal Server Error");
  });
});

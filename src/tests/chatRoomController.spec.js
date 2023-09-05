const request = require("supertest");
const app = require("../../app");
const User = require("../models/User");
const Chat = require("../models/Chat");
const ChatRoom = require("../models/ChatRoom");
const verifyToken = require("../middlewares/verifyToken");

jest.mock("../configs/s3Config", () => ({
  getS3Client: jest.fn().mockReturnValue({
    send: jest.fn().mockResolvedValue(true),
  }),
  getPutObjectCommand: jest.fn(),
  getDeleteObjectCommand: jest.fn(),
}));

jest.mock("../middlewares/verifyToken");

describe("ChatRoom Controller", () => {
  beforeEach(async () => {
    await User.deleteMany({});
    await Chat.deleteMany({});
    await ChatRoom.deleteMany({});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should get chat rooms", async () => {
    verifyToken.mockImplementation((req, res, next) => {
      req.user = {
        email: "test@gmail.com",
        password: "123456",
        nickname: "darren",
      };

      next();
    });

    const user = await User.create({ email: "test@gmail.com", password: "123456", nickname: "darren" });

    const testUser1 = await User.create({ email: "test2@gmail.com", password: "123456", nickname: "john" });
    const testUser2 = await User.create({ email: "test3@gmail.com", password: "123456", nickname: "jane" });

    await ChatRoom.create({
      title: "testChatRoom",
      madeBy: user._id,
      users: [testUser1, testUser2],
      createdDate: "2023-08-29T19:35:25.530+00:00",
    });

    const response = await request(app).get(`/users/${user._id}/chat-rooms`).query({
      page: 1,
      limit: 10,
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("chatRooms");
  });

  test("should get a single chat room", async () => {
    verifyToken.mockImplementation((req, res, next) => {
      req.user = {
        email: "test@gmail.com",
        password: "123456",
        nickname: "darren",
      };

      next();
    });

    const user = await User.create({ email: "test@gmail.com", password: "123456", nickname: "darren" });

    const testUser1 = await User.create({ email: "test2@gmail.com", password: "123456", nickname: "john" });
    const testUser2 = await User.create({ email: "test3@gmail.com", password: "123456", nickname: "jane" });

    const chatRoom = await ChatRoom.create({
      title: "testChatRoom",
      madeBy: user._id,
      users: [testUser1, testUser2],
      createdDate: "2023-08-29T19:35:25.530+00:00",
    });

    const response = await request(app).get(`/users/${user._id}/chat-rooms/${chatRoom._id}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("chatRoom");
  });

  test("should handle error when chatRoom does not exist", async () => {
    verifyToken.mockImplementation((req, res, next) => {
      req.user = {
        email: "test@gmail.com",
        password: "123456",
        nickname: "darren",
      };

      next();
    });

    const user = await User.create({ email: "test@gmail.com", password: "123456", nickname: "darren" });

    const testUser1 = await User.create({ email: "test2@gmail.com", password: "123456", nickname: "john" });
    const testUser2 = await User.create({ email: "test3@gmail.com", password: "123456", nickname: "jane" });

    await ChatRoom.create({
      title: "testChatRoom",
      madeBy: user._id,
      users: [testUser1, testUser2],
      createdDate: "2023-08-29T19:35:25.530+00:00",
    });

    const response = await request(app).get(`/users/${user._id}/chat-rooms/${user._id}`);

    expect(response.statusCode).toBe(404);
    expect(JSON.parse(response.error.text).message).toBe("존재하지 않는 대화방 입니다.");
  });

  test("should create a chat room", async () => {
    verifyToken.mockImplementation((req, res, next) => {
      req.user = {
        email: "test@gmail.com",
        password: "123456",
        nickname: "darren",
      };

      next();
    });

    const newChatRoom = {
      title: "test room",
    };

    const user = await User.create({ email: "test@gmail.com", password: "123456", nickname: "darren" });
    const response = await request(app).post(`/users/${user._id}/chat-rooms`).send(newChatRoom);
    const chatRoom = await ChatRoom.findOne({ title: "test room" });

    expect(response.statusCode).toBe(201);
    expect(chatRoom).not.toBeNull();
  });

  test("should delete a chat room", async () => {
    verifyToken.mockImplementation((req, res, next) => {
      req.user = {
        email: "test@gmail.com",
        password: "123456",
        nickname: "darren",
      };

      next();
    });

    const user = await User.create({ email: "test@gmail.com", password: "123456", nickname: "darren" });
    const chatRoom = await ChatRoom.create({
      title: "testChatRoom",
      madeBy: user._id,
      users: [],
      createdDate: "2023-08-29T19:35:25.530+00:00",
    });

    const response = await request(app).delete(`/users/${user._id}/chat-rooms/${chatRoom._id}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test("should create a chat", async () => {
    verifyToken.mockImplementation((req, res, next) => {
      req.user = {
        email: "test@gmail.com",
        password: "123456",
        nickname: "darren",
      };

      next();
    });

    const user = await User.create({ email: "test@gmail.com", password: "123456", nickname: "darren" });
    const chatRoom = await ChatRoom.create({
      title: "testChatRoom",
      madeBy: user._id,
      users: [],
      chats: [],
      createdDate: "2023-08-29T19:35:25.530+00:00",
    });

    const newChat = {
      newChat: {
        writer: {
          _id: user._id,
        },
        content: "test text",
        isSystem: false,
      },
    };

    const response = await request(app).post(`/users/${user._id}/chat-rooms/${chatRoom._id}`).send(newChat);
    const chat = await Chat.findOne({ content: "test text" });
    const updatedChatRoom = await ChatRoom.findById(chatRoom._id);

    expect(response.statusCode).toBe(201);
    expect(chat).not.toBeNull();
    expect(updatedChatRoom.chats[0].toString()).toBe(chat._id.toString());
  });
});

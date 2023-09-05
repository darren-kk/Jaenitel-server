const request = require("supertest");
const app = require("../../app");
const Users = require("../models/User");

jest.mock("../middlewares/validateLogin", () => {
  return jest.fn((req, res, next) => next());
});

jest.mock("../middlewares/validateSignup", () => {
  return jest.fn((req, res, next) => next());
});

jest.mock("../middlewares/verifyToken");

const verifyToken = require("../middlewares/verifyToken");

describe("Authentication Routes", () => {
  beforeEach(async () => {
    await Users.deleteMany({});
  });

  test("should login a user", async () => {
    const mockUser = {
      email: "test@gmail.com",
      password: "123456",
      nickname: "darren",
    };

    await Users.create(mockUser);

    const response = await request(app)
      .post("/auth/login")
      .send({ email: mockUser.email, password: mockUser.password });

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty("user");
  });

  test("should response with error when user is not served", async () => {
    const mockUser = {
      email: "test@gmail.com",
      password: "123456",
      nickname: "darren",
    };

    await Users.create(mockUser);

    const response = await request(app).post("/auth/login").send({});

    expect(response.statusCode).toBe(500);
    expect(response.body.message).toBe("Internal Server Error");
  });

  test("should signup a new user", async () => {
    const newUser = {
      email: "test@gmail.com",
      password: "123456",
      nickname: "darren",
    };

    const response = await request(app).post("/auth/signup").send(newUser);

    expect(response.statusCode).toBe(201);
    expect(response.body.newUser.email).toBe(newUser.email);
    expect(response.body.newUser.nickname).toBe(newUser.nickname);
    expect(response.body.newUser.password).not.toBe(newUser.password);
  });

  test("should response with error when new user is not served", async () => {
    const response = await request(app).post("/auth/signup").send({});

    expect(response.statusCode).toBe(500);
    expect(response.body.message).toBe("Internal Server Error");
  });

  test("should logout a user", async () => {
    verifyToken.mockImplementation((req, res, next) => {
      req.user = {
        email: "test@gmail.com",
        password: "123456",
        nickname: "darren",
      };

      next();
    });

    const response = await request(app).post("/auth/logout").set("Cookie", ["AccessToken=your_test_token"]);

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.headers["set-cookie"]).toContain(
      "AccessToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly",
    );
  });

  test("should check a user", async () => {
    verifyToken.mockImplementation((req, res, next) => {
      req.user = {
        email: "test@gmail.com",
        password: "123456",
        nickname: "darren",
      };

      next();
    });

    const response = await request(app).get("/auth/check");

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body).toHaveProperty("user");
  });

  test("should response with error when req.user is not defined", async () => {
    verifyToken.mockImplementation((req, res, next) => {
      req.user = null;

      next();
    });

    const response = await request(app).get("/auth/check");

    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe("사용자 인증에 실패 하였습니다! 다시 로그인 해주세요.");
  });
});

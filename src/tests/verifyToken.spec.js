const request = require("supertest");
const express = require("express");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const User = require("../models/User");
const verifyToken = require("../middlewares/verifyToken");

const app = express();

app.use(express.json());
app.use(cookieParser());

app.get("/check", verifyToken, (req, res) => res.status(200).send("checked Route"));

app.use((err, req, res, next) => {
  res.status(err.status || 500).send(err.message);
});

jest.mock("jsonwebtoken");
jest.mock("../models/User");

describe("verifyToken Middleware", () => {
  beforeEach(() => {
    jwt.verify.mockClear();
    User.findById.mockClear();
  });

  test("should pass for valid token", async () => {
    const mockUser = { _id: "12345", email: "test@gmail.com" };
    jwt.verify.mockReturnValue({ id: mockUser._id });
    User.findById.mockResolvedValue(mockUser);

    const response = await request(app).get("/check").set("Cookie", ["AccessToken=validToken"]);

    expect(response.statusCode).toBe(200);
    expect(response.text).toBe("checked Route");
  });

  test("should fail for missing token", async () => {
    const response = await request(app).get("/check");

    expect(response.statusCode).toBe(400);
    expect(response.text).toBe("이미 존재하는 이메일 입니다!");
  });

  test("should fail for JWT verification error", async () => {
    jwt.verify.mockImplementation(() => {
      throw new Error("JWT verification failed");
    });

    const response = await request(app).get("/check").set("Cookie", ["AccessToken=invalidToken"]);

    expect(response.statusCode).toBe(500);
    expect(response.text).toBe("JWT verification failed");
  });
});

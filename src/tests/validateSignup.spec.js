const request = require("supertest");
const express = require("express");
const validateSignup = require("../middlewares/validateSignup");
const User = require("../models/User");

const app = express();

app.use(express.json());

app.post("/signup", validateSignup, (req, res) => res.status(200).send("Signed up"));

app.use((err, req, res, next) => {
  res.status(err.status || 500).send(err.message);
});

describe("validateSignup Middleware", () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  test("should pass for valid email, nickname, and password", async () => {
    const response = await request(app).post("/signup").send({
      email: "test@gmail.com",
      nickname: "darren",
      password: "test123",
      reWrittenPassword: "test123",
    });

    expect(response.statusCode).toBe(200);
    expect(response.text).toBe("Signed up");
  });

  test("should fail for existing email", async () => {
    await User.create({ email: "test@gmail.com", password: "test123", nickname: "darren" });

    const response = await request(app).post("/signup").send({
      email: "test@gmail.com",
      nickname: "john",
      password: "test123",
      reWrittenPassword: "test123",
    });

    expect(response.statusCode).toBe(400);
    expect(response.text).toBe("이미 존재하는 이메일 입니다!");
  });

  test("should fail for existing nickname", async () => {
    await User.create({ email: "test@gmail.com", password: "test123", nickname: "darren" });

    const response = await request(app).post("/signup").send({
      email: "john@gmail.com",
      nickname: "darren",
      password: "test123",
      reWrittenPassword: "test123",
    });

    expect(response.statusCode).toBe(400);
    expect(response.text).toBe("이미 존재하는 닉네임 입니다!");
  });

  test("should fail for invalid nickname length", async () => {
    const response = await request(app).post("/signup").send({
      email: "test@gmail.com",
      nickname: "d",
      password: "test123",
      reWrittenPassword: "test123",
    });

    expect(response.statusCode).toBe(400);
    expect(response.text).toBe("닉네임은 최소 2자리 이상, 8자리 이하여야 합니다.");
  });

  test("should fail for missing email", async () => {
    const response = await request(app).post("/signup").send({
      nickname: "darren",
      password: "test123",
      reWrittenPassword: "test123",
    });

    expect(response.statusCode).toBe(400);
    expect(response.text).toBe("이메일을 입력해주세요!");
  });

  test("should fail for missing password", async () => {
    const response = await request(app).post("/signup").send({
      email: "test@gmail.com",
      nickname: "darren",
    });

    expect(response.statusCode).toBe(400);
    expect(response.text).toBe("비밀번호를 입력해주세요!");
  });

  test("should fail for mismatched passwords", async () => {
    const response = await request(app).post("/signup").send({
      email: "test@gmail.com",
      nickname: "darren",
      password: "test123",
      reWrittenPassword: "wrongpassword",
    });

    expect(response.statusCode).toBe(400);
    expect(response.text).toBe("비밀번호가 일치하지 않습니다!");
  });

  test("should fail for invalid password length", async () => {
    const response = await request(app).post("/signup").send({
      email: "test@gmail.com",
      nickname: "darren",
      password: "test",
      reWrittenPassword: "test",
    });

    expect(response.statusCode).toBe(400);
    expect(response.text).toBe("비밀번호는 최소 6자리 이상, 20자리 이하여야 합니다.");
  });
});

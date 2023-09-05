const request = require("supertest");
const express = require("express");
const bcrypt = require("bcrypt");
const validateLogin = require("../middlewares/validateLogin");
const User = require("../models/User");

const app = express();

app.use(express.json());

app.post("/login", validateLogin, (req, res) => res.status(200).send("Logged in"));

app.use((err, req, res, next) => {
  res.status(err.status || 500).send(err.message);
});

describe("validateLogin Middleware", () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  test("should pass for valid email and password", async () => {
    const password = await bcrypt.hash("test123", 10);
    await User.create({ email: "test@gmail.com", password, nickname: "darren" });

    const response = await request(app).post("/login").send({
      email: "test@gmail.com",
      password: "test123",
    });

    expect(response.statusCode).toBe(200);
    expect(response.text).toBe("Logged in");
  });

  test("should fail for non-existent user", async () => {
    const response = await request(app).post("/login").send({
      email: "nonexistent@gmail.com",
      password: "test123",
    });

    expect(response.statusCode).toBe(400);
    expect(response.text).toBe("존재하지 않는 사용자 입니다.");
  });

  test("should fail for incorrect password", async () => {
    const password = await bcrypt.hash("test123", 10);
    await User.create({ email: "test@gmail.com", password, nickname: "darren" });

    const response = await request(app).post("/login").send({
      email: "test@gmail.com",
      password: "wrongpassword",
    });

    expect(response.statusCode).toBe(400);
    expect(response.text).toBe("비밀번호가 일치하지 않습니다.");
  });

  test("should fail for missing email", async () => {
    const response = await request(app).post("/login").send({
      password: "test123",
    });

    expect(response.statusCode).toBe(400);
    expect(response.text).toBe("이메일을 입력해주세요!");
  });

  test("should fail for missing password", async () => {
    const password = await bcrypt.hash("test123", 10);
    await User.create({ email: "test@gmail.com", password, nickname: "darren" });

    const response = await request(app).post("/login").send({
      email: "test@gmail.com",
    });

    expect(response.statusCode).toBe(400);
    expect(response.text).toBe("비밀번호를 입력해주세요!");
  });
});

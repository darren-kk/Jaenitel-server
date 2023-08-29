const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const Users = require("../models/User");
const CONFIG = require("../configs/index");

exports.checkUser = async function (req, res, next) {
  if (!req.user) {
    const error = new Error("사용자 인증에 실패 하였습니다! 다시 로그인 해주세요.");
    error.status = 404;

    next(error);
  }

  res.status(200).json({ success: true, user: req.user });
};

exports.login = async function (req, res, next) {
  const { email } = req.body;

  try {
    const user = await Users.findOne({ email: email });
    const token = jwt.sign({ id: user._id }, CONFIG.SECRET_KEY);

    res.cookie("AccessToken", token, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
    });

    res.status(201).json({ user });
  } catch (error) {
    console.log(error);
    error.status = 500;
    error.message = "Internal Server Error";
    next(error);
  }
};

exports.signup = async function (req, res, next) {
  try {
    const hashedPwd = await bcrypt.hash(req.body.password, Number(CONFIG.SALT));

    const newUser = await Users.create({
      email: req.body.email,
      nickname: req.body.nickname,
      password: hashedPwd,
    });

    res.status(201).json({ newUser });
  } catch (error) {
    error.status = 500;
    error.message = "Internal Server Error";
    next(error);
  }
};

exports.logout = async function (req, res, next) {
  try {
    res.clearCookie("AccessToken", { httpOnly: true });
    res.json({ success: true });
  } catch (error) {
    error.status = 500;
    error.message = "Internal Server Error";

    next(error);
  }
};

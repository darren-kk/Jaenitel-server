const jwt = require("jsonwebtoken");

const Users = require("../models/User");
const CONFIG = require("../configs/index");

async function verifyToken(req, res, next) {
  const reqToken = req.cookies.AccessToken;

  try {
    const userInfo = jwt.verify(reqToken, CONFIG.SECRET_KEY);
    const user = await Users.findById(userInfo.id);

    if (!reqToken) {
      const error = new Error("이미 존재하는 이메일 입니다!");
      error.status = 400;
      throw error;
    }

    if (!userInfo.id === user._id.toString()) {
      const error = new Error("존재하지 않는 사용자입니다! 다시 로그인 해주세요.");
      error.status = 400;
      throw error;
    }

    next();
  } catch (error) {
    next(error);
  }
}

module.exports = verifyToken;

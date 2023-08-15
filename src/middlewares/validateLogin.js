const bcrypt = require("bcrypt");

const Users = require("../models/User");

async function validateLogin(req, res, next) {
  const { email, password } = req.body;
  try {
    const user = await Users.findOne({ email: email });
    const userPwd = user.password;
    const match = await bcrypt.compare(password, userPwd);

    if (!email) {
      const error = new Error("이메일을 입력해주세요!");
      error.status = 400;
      throw error;
    }

    if (!password) {
      const error = new Error("비밀번호를 입력해주세요!");
      error.status = 400;
      throw error;
    }

    if (!user) {
      const error = new Error("존재하지 않는 사용자 입니다.");
      error.status = 400;
      throw error;
    }

    if (!match) {
      const error = new Error("비밀번호가 일치하지 않습니다.");
      error.status = 400;
      throw error;
    }

    next();
  } catch (error) {
    next(error);
  }
}

module.exports = validateLogin;

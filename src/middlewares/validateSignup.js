const Users = require("../models/User");

async function validateSignup(req, res, next) {
  const { email, nickname, password, reWrittenPassword } = req.body;

  try {
    const user = await Users.findOne({ email: email });
    const userNickName = await Users.findOne({ nickname: nickname });

    if (user) {
      const error = new Error("이미 존재하는 이메일 입니다!");
      error.status = 400;
      throw error;
    }

    if (userNickName) {
      const error = new Error("이미 존재하는 닉네임 입니다!");
      error.status = 400;
      throw error;
    }

    if (nickname.length < 2 || nickname.length > 8) {
      const error = new Error("닉네임은 최소 2자리 이상, 8자리 이하여야 합니다.");
      error.status = 400;
      throw error;
    }

    if (!email) {
      const error = new Error("이메일을 입력해주세요!");
      error.status = 400;
      throw error;
    }

    if (!password || !reWrittenPassword) {
      const error = new Error("비밀번호를 입력해주세요!");
      error.status = 400;
      throw error;
    }

    if (password.length < 6 || password.length > 20) {
      const error = new Error("비밀번호는 최소 6자리 이상, 20자리 이하여야 합니다.");
      error.status = 400;
      throw error;
    }

    if (password !== reWrittenPassword) {
      const error = new Error("비밀번호가 일치하지 않습니다!");
      error.status = 400;
      throw error;
    }

    next();
  } catch (error) {
    next(error);
  }
}

module.exports = validateSignup;

require("dotenv").config();

const CONFIG = {
  PORT: process.env.PORT,
  MONGODB_URL: process.env.MONGODB_URL,
  CLIENT_URL: process.env.CLIENT_URL,
  SECRET_KEY: process.env.SECRET_KEY,
  ONE_HOUR_IN_MS: 1000 * 60 * 60,
};

module.exports = CONFIG;

const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const CONFIG = require("../configs/index");

async function expressLoader(app) {
  app.use(
    cors({
      origin: CONFIG.CLIENT_URL,
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());
}

module.exports = expressLoader;

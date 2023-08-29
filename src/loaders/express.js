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

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: false, limit: "50mb" }));

  app.use(cookieParser());
}

module.exports = expressLoader;

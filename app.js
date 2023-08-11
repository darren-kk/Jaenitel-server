const express = require("express");
const mongooseLoader = require("./src/loaders/mongoose");
const expressLoader = require("./src/loaders/express");
const routerLoader = require("./src/loaders/routers");
const errorHandlerLoader = require("./src/loaders/errorHandler");

const app = express();

(async function appLoader(app) {
  await mongooseLoader();
  await expressLoader(app);
  await routerLoader(app);
  await errorHandlerLoader(app);
})(app);

module.exports = app;

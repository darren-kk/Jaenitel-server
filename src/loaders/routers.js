const authRouter = require("../routes/auth");
const usersRouter = require("../routes/users");
const indexRouter = require("../routes/index");

async function routerLoader(app) {
  app.use("/", indexRouter);
  app.use("/auth", authRouter);
  app.use("/users", usersRouter);
}

module.exports = routerLoader;

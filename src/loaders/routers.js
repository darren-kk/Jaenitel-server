const authRouter = require("../routes/auth");
const usersRouter = require("../routes/users");

async function routerLoader(app) {
  app.use("/auth", authRouter);
  app.use("/users", usersRouter);
}

module.exports = routerLoader;

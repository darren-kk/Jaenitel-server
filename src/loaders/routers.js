const indexRouter = require("../routes/index");
const usersRouter = require("../routes/users");

async function routerLoader(app) {
  app.use("/", indexRouter);
  app.use("/users", usersRouter);
}

module.exports = routerLoader;
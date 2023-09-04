const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");

const mongoServer = new MongoMemoryServer();

beforeAll(async () => {
  await mongoose.disconnect();
  await mongoServer.start();
  const mongoUri = mongoServer.getUri();

  await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
}, 10000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

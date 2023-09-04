const mongoose = require("mongoose");
const CONFIG = require("../configs/index");

async function mongooseLoader() {
  try {
    if (mongoose.connection.readyState === 0) {
      mongoose.connect(CONFIG.MONGODB_URL, { dbName: "JanieTel" });
    }
    console.log("connected to database");
  } catch (error) {
    console.error(error);
  }
}

module.exports = mongooseLoader;

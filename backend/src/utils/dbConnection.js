const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI;
const NODE_ENV = process.env.NODE_ENV || "development";

if (!MONGO_URI) {
  console.log("MONGO_URI is not defined in environment variables");
  throw new Error("MONGO_URI is not defined in environment variables");
}

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return mongoose.connection;

  try {
    mongoose.set("strictQuery", true);

    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      maxPoolSize: 10,
      minPoolSize: 2,
      retryWrites: true,
      w: "majority",
    });

    isConnected = true;

    console.log(`✅ MongoDB connected (${NODE_ENV})`);

    mongoose.connection.on("disconnected", () => {
      isConnected = false;
      console.error("⚠️ MongoDB disconnected");
    });

    mongoose.connection.on("reconnected", () => {
      isConnected = true;
      console.log("✅ MongoDB reconnected");
    });

    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB connection error:", err);
    });

    return mongoose.connection;
  } catch (error) {
    isConnected = false;
    console.error("❌ Failed to connect to MongoDB:", error.message);
    throw error;
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    isConnected = false;
    console.log("✅ MongoDB connection closed");
  } catch (error) {
    console.error("❌ Error closing MongoDB connection:", error.message);
    throw error;
  }
};

module.exports = { connectDB, disconnectDB };
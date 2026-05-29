const mongoose = require("mongoose");

const connectDatabase = () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.warn("MONGO_URI is not set — skipping database connection");
    return;
  }

  mongoose
    .connect(uri)
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.error("MongoDB connection failed:", err.message));
};

module.exports = connectDatabase;

const express = require("express");
const rateLimit = require("express-rate-limit");
const dotenv = require("dotenv");
const dbConnection = require("./src/utils/dbConnection");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const Auth = require("./src/controllers/auth");

dotenv.config(); 

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(cookieParser());
app.use(express.json());

// Rate Limit
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// MongoDB
dbConnection();

// Routes
app.use("/api/auth", limiter, Auth);

// Server Listen
app.listen(PORT, (err) => {
  if (err) {
    console.error("❌ Server can't connect:", err);
  } else {
    console.log(`✅ Server running on port ${PORT}`);
  }
});
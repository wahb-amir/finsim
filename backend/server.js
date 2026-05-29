const express = require("express");
const rateLimit = require("express-rate-limit");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const Auth = require("./src/controllers/auth");
const {connectDB} = require("./src/utils/dbConnection");

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

connectDB();

// Middleware
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());

// RateLimit
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

// Routes
app.use("/api/auth", limiter, Auth);

// Health check (CI)
app.use("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
  });
});

// Server Listen
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
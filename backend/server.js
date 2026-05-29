const path = require("path");
const dotenv = require("dotenv");

// Load env first
dotenv.config({
  path: path.resolve(__dirname, ".env"),
});

const express = require("express");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const {connectDB} = require("./src/utils/dbConnection");
const Auth = require("./src/controllers/auth");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

// Rate limit
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

// Connect DB
connectDB();

// Routes
app.use("/api/auth", limiter, Auth);

// IMPORTANT: DON'T REMOVE THIS ROUTE , IT IS USED FOR CI HEALTH CHECK
app.use("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server connected on port ${PORT}`);
});
const cors = require("cors");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");

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

function applyMiddleware(app) {
  app.use(cors());
  app.use(cookieParser());
  app.use(limiter);
}

module.exports = { applyMiddleware };

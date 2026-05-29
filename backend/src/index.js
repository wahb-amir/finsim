const express = require("express");
const rateLimit = require("express-rate-limit");
const dotenv = require("dotenv");
const dbConnection = require("./src/utils/dbConnection")
const cors = require("cors");
const cookieParser = require("cookie-parser");
const Auth = require("./src/controllers/auth");

dotenv.config();

const app = express();
const PORT = process.env.PORT;

//Middleware
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

//RateLimit
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

//Mongoose
dbConnection();

//Server Listen
app.listen(PORT, (err)=>{
    if(err){
        console.err("❌❌ Server Can't Connnected");
    } else{
        console.log("✅✅ Server Connected")
    }
})
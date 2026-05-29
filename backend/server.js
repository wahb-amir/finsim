const express = require("express");
const rateLimit = require("express-rate-limit");
const dotenv = require("dotenv");
// const dbConnection = require("./utils/dbConnection");
const dbConnection = require("./src/utils/dbConnection")
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();
const PORT = process.env.PORT;

//Middleware
dotenv.config();
app.use(cors())
app.use(cookieParser())

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
app.use(limiter);

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
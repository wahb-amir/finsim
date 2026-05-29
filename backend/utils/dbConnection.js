const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const dbConnection = () => {
    mongoose.connect(process.env.MONGO_URI,{})
    .then(()=>{console.log("✅✅ MongoDB Connected")})
    .catch(()=>{console.log("❌❌ MongoDB Can't Connect")})
}

module.exports = dbConnection;
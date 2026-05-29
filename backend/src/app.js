const express = require("express");
const { applyMiddleware } = require("./middleware");
const routes = require("./routes");

const app = express();

app.use(express.json());
applyMiddleware(app);
app.use("/api", routes);

module.exports = app;

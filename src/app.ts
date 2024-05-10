// const nconf = require("nconf");
// nconf.file("./config.json");

// let mongoUrl = nconf.get("mongodb-url");
let mongoUrl =
  process.env.MONGODB_URL ||
  "mongodb+srv://localusr_iroomz:SyfI3mZ3bps48N5W@iroomz-local.mgxtyd6.mongodb.net/iroomz?retryWrites=true&w=majority";
// let port = nconf.get("port");
let port = process.env.PORT || 1888;
const accessControlAllowOrigin = "*";
const mongoose = require("mongoose");
const express = require("express");
import { Request, Response, NextFunction } from "express";
const app = express();

const options = {
  autoIndex: false, // Don't build indexes
  //maxPoolSize: 10, // Maintain up to 10 socket connections
  // bufferMaxEntries: 0, deprecated
  //useNewUrlParser: true,
  //useUnifiedTopology: true,
};

mongoose.connect(mongoUrl, options);

mongoose.connection.on("error", function (e: string) {
  console.log("<mongo> error -> " + e);
});

mongoose.connection.on("connected", function () {
  console.log("<mongo> connected => " + mongoUrl);
});

mongoose.connection.on("disconnecting", function () {
  console.log("<mongo> disconnecting.");
});

mongoose.connection.on("disconnected", function () {
  console.log("<mongo> disconnected.");
});

mongoose.connection.on("reconnected", function () {
  console.log("<mongo> reconnected => " + mongoUrl);
});

mongoose.connection.on("timeout", function (e: string) {
  console.log("<mongo> timeout => " + e);
});

mongoose.connection.on("close", function () {
  console.log("<mongo> connection closed.");
});

app.use(express.json({ limit: "4mb" }));
app.use(express.urlencoded({ limit: "4mb", extended: true }));

app.use((req: Request, res: Response, next: NextFunction) => {
  // Website you wish to allow to connect
  res.setHeader("Access-Control-Allow-Origin", accessControlAllowOrigin);

  // Request methods you wish to allow
  res.setHeader("Access-Control-Allow-Methods", "GET, POST");

  // Request headers you wish to allow
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type"
  );

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader("Access-Control-Allow-Credentials", "true");

  // Pass to next layer of middleware
  next();
});
app.disable("x-powered-by");

const echo = `iRoomz backend-services`;

app.get("/", (req: Request, res: Response) => {
  res.end(echo);
});

require("./app/services/userService")(app);

const server = app.listen(port, () => {
  let host = server.address().address;

  console.log(`${echo} is running at http://${host}:${port}`);
});

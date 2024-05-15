//package
import { Request, Response, NextFunction } from "express";
const mongoose = require("mongoose");
const express = require("express");
// const nconf = require("nconf");
// nconf.file("./config.json");

//variable
// const mongoUrl = nconf.get("mongodb-url");
const mongoUrl =
  process.env.MONGODB_URL ||
  "mongodb+srv://localpersonaldatabase:WWWm0ng0@personaldatabase.wmkztyx.mongodb.net/?retryWrites=true&w=majority&appName=personaldatabase";
// const port = nconf.get("port");
const port = process.env.PORT || 1888;
const accessControlAllowOrigin = "*";
const app = express();
const echo = `backend-services`;
const options = {
  autoIndex: false, // Don't build indexes
  //maxPoolSize: 10, // Maintain up to 10 socket connections
  //bufferMaxEntries: 0, deprecated
  //useNewUrlParser: true,
  //useUnifiedTopology: true,
};

//mongoose
mongoose.connect(mongoUrl, options);

mongoose.connection.on("error", (e: string) => {
  console.log("<mongo> error -> " + e);
});

mongoose.connection.on("connected", () => {
  console.log("<mongo> connected => " + mongoUrl);
});

mongoose.connection.on("disconnecting", () => {
  console.log("<mongo> disconnecting.");
});

mongoose.connection.on("disconnected", () => {
  console.log("<mongo> disconnected.");
});

mongoose.connection.on("reconnected", () => {
  console.log("<mongo> reconnected => " + mongoUrl);
});

mongoose.connection.on("timeout", (e: string) => {
  console.log("<mongo> timeout => " + e);
});

mongoose.connection.on("close", () => {
  console.log("<mongo> connection closed.");
});

//to allow application to accept JSON data with 4mb limit
app.use(express.json({ limit: "4mb" }));
//to allow application to accept url encoded data with 4mb limit
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

//it helps to obscure information about the server and framework being used by
//not to include the "X-Powered-By" header in any HTTP responses sent by your application
app.disable("x-powered-by");

app.get("/", (req: Request, res: Response) => {
  res.end(echo);
});

//service
require("./services/userService")(app);

//listens for incoming connections on the specified port
const server = app.listen(port, () => {
  let host = server.address().address;
  //logs a message indicating the server's address and port when it starts successfully
  console.log(`${echo} is running at http://${host}:${port}`);
});

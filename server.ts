import { app } from "./app";
import { v2 as cloudinary } from "cloudinary";
import http from "http"
import connectDB from "./utils/db";
import { initSocketServer } from "./socket-server";
require("dotenv").config();

const server = http.createServer(app)
//cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key:  process.env.CLOUD_API_KEY,
  api_secret : process.env.CLOUD_SECRET_KEY
})

initSocketServer(server)

// create server
server.listen(process.env.PORT, () => {
  console.log(`Server is connected with port ${process.env.HOSTNAME}:${process.env.PORT}`);
  connectDB()
});

import { Server as SocketIOServer } from "socket.io";
import http from "http";

export const initSocketServer = (server: http.Server) => {
  const io = new SocketIOServer(server);

  io.on("connection", (socket) => {
    console.log(`A user ${socket.id} connected`);

    // listen 'notification' even from the fontend
    socket.on("notification", (data) => {
      //broadcast the noti for all client
      io.emit("newNotification", data);
    });

    socket.on("disconnect", () => {
      console.log("A user disconnected");
    });
  });
};


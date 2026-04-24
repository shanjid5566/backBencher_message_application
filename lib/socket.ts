import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { config } from "../src/config";

let io: Server;

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: config.clientUrl, // Frontend URL (e.g., http://localhost:3000)
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("🟢 A user connected via Socket.IO:", socket.id);

    // We will add logic here to mark user as ONLINE in database

    socket.on("disconnect", () => {
      console.log("🔴 A user disconnected:", socket.id);
      // We will add logic here to mark user as OFFLINE in database
    });
  });

  return io;
};

// Utility function to get the io instance anywhere in the app
export const getIo = () => {
  if (!io) {
    throw new Error("Socket.io is not initialized!");
  }
  return io;
};
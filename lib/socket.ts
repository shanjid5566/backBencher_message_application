import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { config } from "../src/config";
import { prisma } from "./prisma"; // Import Prisma client

let io: Server;

// Keep track of connected users (Socket ID -> User ID)
const userSocketMap = new Map<string, string>();

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: [
        config.clientUrl,
        "null",
        "http://127.0.0.1:5500",
        "http://localhost:5500",
      ],
      credentials: true,
    },
  });

  io.on("connection", (socket: Socket) => {
    console.log("🟢 A user connected:", socket.id);

    // 1. Listen for the frontend to send the User ID upon connection
    socket.on("user_connected", async (userId: string) => {
      if (!userId) return;

      // Store the mapping
      userSocketMap.set(socket.id, userId);

      try {
        // Update user status to online in the database
        await prisma.user.update({
          where: { id: userId },
          data: { isOnline: true },
        });

        // Broadcast to all other users that this user is online
        socket.broadcast.emit("user_status_changed", {
          userId,
          isOnline: true,
        });

        console.log(`✅ User ${userId} is now ONLINE`);
      } catch (error) {
        console.error("Failed to update online status:", error);
      }
    });

    // 2. Handle Disconnect
    socket.on("disconnect", async () => {
      console.log("🔴 A user disconnected:", socket.id);

      const userId = userSocketMap.get(socket.id);

      if (userId) {
        try {
          // Update user status to offline and set lastSeen
          await prisma.user.update({
            where: { id: userId },
            data: {
              isOnline: false,
              lastSeen: new Date(),
            },
          });

          // Broadcast to all other users that this user is offline
          socket.broadcast.emit("user_status_changed", {
            userId,
            isOnline: false,
            lastSeen: new Date(),
          });

          console.log(`❌ User ${userId} is now OFFLINE`);

          // Remove from tracking map
          userSocketMap.delete(socket.id);
        } catch (error) {
          console.error("Failed to update offline status:", error);
        }
      }
    });
  });

  return io;
};

export const getIo = () => {
  if (!io) {
    throw new Error("Socket.io is not initialized!");
  }
  return io;
};

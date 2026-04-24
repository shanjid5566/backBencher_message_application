import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { config } from "../src/config";
import { prisma } from "./prisma";

let io: Server;

// Map to keep track of userId -> socketId (Easier to find receiver's socket)
const userSocketMap = new Map<string, string>();

// Utility function to get a user's socket ID for sending private messages
export const getReceiverSocketId = (receiverId: string) => {
  return userSocketMap.get(receiverId);
};

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: [config.clientUrl, "null", "http://127.0.0.1:5500", "http://localhost:5500"],
      credentials: true,
    },
  });

  io.on("connection", (socket: Socket) => {
    console.log("🟢 A user connected:", socket.id);

    // 1. Listen for connection
    socket.on("user_connected", async (userId: string) => {
      if (!userId) return;

      // Map the USER ID to their current SOCKET ID
      userSocketMap.set(userId, socket.id);

      try {
        await prisma.user.update({
          where: { id: userId },
          data: { isOnline: true },
        });

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
      
      // Find the user ID from the socket ID
      const userId = [...userSocketMap.entries()].find(([_, sid]) => sid === socket.id)?.[0];

      if (userId) {
        try {
          await prisma.user.update({
            where: { id: userId },
            data: { 
              isOnline: false,
              lastSeen: new Date()
            },
          });

          socket.broadcast.emit("user_status_changed", {
            userId,
            isOnline: false,
            lastSeen: new Date()
          });

          console.log(`❌ User ${userId} is now OFFLINE`);
          
          // Remove from tracking map
          userSocketMap.delete(userId);
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
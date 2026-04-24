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
      if (!userId) {
        console.warn("⚠️  user_connected event received but no userId provided");
        return;
      }

      // Map the USER ID to their current SOCKET ID
      userSocketMap.set(userId, socket.id);
      console.log(`📌 User ${userId} mapped to socket ${socket.id}`);
      console.log(`📊 Current user socket map:`, Array.from(userSocketMap.entries()));

      try {
        const existingUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true },
        });

        if (!existingUser) {
          console.warn(`⚠️  User ${userId} not found in database. Skipping online status update.`);
          return;
        }

        await prisma.user.update({
          where: { id: userId },
          data: { isOnline: true },
        });

        socket.broadcast.emit("user_status_changed", {
          userId,
          isOnline: true,
        });

        console.log(`✅ User ${userId} is now ONLINE`);
      } catch (error: any) {
        if (error.code === "P1017") {
          console.warn("⚠️  DB connection closed while setting online status.");
          return;
        }

        console.error("Failed to update online status:", error);
      }
    });

    // ----------------------------------------------------
    // TYPING INDICATOR LOGIC
    // ----------------------------------------------------
    
    // Listen for 'typing' event from frontend
    socket.on("typing", ({ receiverId, conversationId }) => {
      const receiverSocketId = getReceiverSocketId(receiverId);
      
      if (receiverSocketId) {
        // Find who is typing (sender's user ID)
        const senderId = [...userSocketMap.entries()].find(([_, sid]) => sid === socket.id)?.[0];
        
        // Emit to the receiver that this sender is typing
        io.to(receiverSocketId).emit("user_typing", {
          senderId,
          conversationId
        });
      }
    });

    // Listen for 'stop_typing' event from frontend
    socket.on("stop_typing", ({ receiverId, conversationId }) => {
      const receiverSocketId = getReceiverSocketId(receiverId);
      
      if (receiverSocketId) {
        const senderId = [...userSocketMap.entries()].find(([_, sid]) => sid === socket.id)?.[0];
        
        io.to(receiverSocketId).emit("user_stopped_typing", {
          senderId,
          conversationId
        });
      }
    });
    // ----------------------------------------------------

    // 2. Handle Disconnect
    socket.on("disconnect", async () => {
      console.log("🔴 A user disconnected:", socket.id);
      
      // Find the user ID from the socket ID
      const userId = [...userSocketMap.entries()].find(([_, sid]) => sid === socket.id)?.[0];

      if (userId) {
        const currentlyMappedSocketId = userSocketMap.get(userId);

        // If another active socket already replaced this one, do not mark the user offline.
        if (currentlyMappedSocketId !== socket.id) {
          return;
        }

        // Remove stale mapping first so emit routing remains correct even if DB update fails.
        userSocketMap.delete(userId);

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
        } catch (error: any) {
          if (error.code === "P2025") {
            console.warn(`⚠️  User ${userId} not found in database. Skipping offline status update.`);
            return;
          }

          if (error.code === "P1017") {
            console.warn("⚠️  DB connection closed while setting offline status.");
            return;
          }

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
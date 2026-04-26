"use strict";
// // import { Server as HttpServer } from "http";
// // import { Server, Socket } from "socket.io";
// // import { config } from "../src/config";
// // import { prisma } from "./prisma";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIo = exports.initSocket = exports.getReceiverSocketId = void 0;
const socket_io_1 = require("socket.io");
const config_1 = require("../src/config");
const prisma_1 = require("./prisma");
let io;
// Map to keep track of userId -> socketId (Easier to find receiver's socket)
const userSocketMap = new Map();
// Utility function to get a user's socket ID for sending private messages
const getReceiverSocketId = (receiverId) => {
    return userSocketMap.get(receiverId);
};
exports.getReceiverSocketId = getReceiverSocketId;
const initSocket = (server) => {
    io = new socket_io_1.Server(server, {
        cors: {
            origin: [
                config_1.config.clientUrl,
                "null",
                "http://127.0.0.1:5500",
                "http://localhost:5500",
            ],
            credentials: true,
        },
    });
    io.on("connection", (socket) => {
        console.log("🟢 A user connected:", socket.id);
        // 1. Listen for connection and update online status
        socket.on("user_connected", async (userId) => {
            if (!userId) {
                console.warn("⚠️  user_connected event received but no userId provided");
                return;
            }
            // Map the USER ID to their current SOCKET ID
            userSocketMap.set(userId, socket.id);
            console.log(`📌 User ${userId} mapped to socket ${socket.id}`);
            console.log(`📊 Current user socket map:`, Array.from(userSocketMap.entries()));
            try {
                const existingUser = await prisma_1.prisma.user.findUnique({
                    where: { id: userId },
                    select: { id: true },
                });
                if (!existingUser) {
                    console.warn(`⚠️  User ${userId} not found in database. Skipping online status update.`);
                    return;
                }
                await prisma_1.prisma.user.update({
                    where: { id: userId },
                    data: { isOnline: true },
                });
                socket.broadcast.emit("user_status_changed", {
                    userId,
                    isOnline: true,
                });
                console.log(`✅ User ${userId} is now ONLINE`);
            }
            catch (error) {
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
            const receiverSocketId = (0, exports.getReceiverSocketId)(receiverId);
            if (receiverSocketId) {
                // Find who is typing (sender's user ID)
                const senderId = [...userSocketMap.entries()].find(([_, sid]) => sid === socket.id)?.[0];
                // Emit to the receiver that this sender is typing
                io.to(receiverSocketId).emit("user_typing", {
                    senderId,
                    conversationId,
                });
            }
        });
        // Listen for 'stop_typing' event from frontend
        socket.on("stop_typing", ({ receiverId, conversationId }) => {
            const receiverSocketId = (0, exports.getReceiverSocketId)(receiverId);
            if (receiverSocketId) {
                const senderId = [...userSocketMap.entries()].find(([_, sid]) => sid === socket.id)?.[0];
                io.to(receiverSocketId).emit("user_stopped_typing", {
                    senderId,
                    conversationId,
                });
            }
        });
        // ----------------------------------------------------
        // REAL-TIME MESSAGE STATUS (SEEN & DELETE)
        // ----------------------------------------------------
        // 1. Real-time event for marking messages as seen
        socket.on("mark_as_seen", ({ conversationId, receiverId }) => {
            const receiverSocketId = (0, exports.getReceiverSocketId)(receiverId);
            if (receiverSocketId) {
                // Notify the other user that messages have been seen (Blue Tick)
                io.to(receiverSocketId).emit("messages_seen_update", {
                    conversationId,
                });
            }
        });
        // 2. Real-time event for deleting message for everyone
        socket.on("message_deleted_for_everyone", ({ messageId, receiverId }) => {
            const receiverSocketId = (0, exports.getReceiverSocketId)(receiverId);
            if (receiverSocketId) {
                // Remove the message instantly from the other user's screen
                io.to(receiverSocketId).emit("message_deleted_update", {
                    messageId,
                });
            }
        });
        // ----------------------------------------------------
        // VIDEO CALL SIGNALING LOGIC (WebRTC & PeerJS)
        // ----------------------------------------------------
        // 1. Initiate Call: Listen for a user trying to call someone
        socket.on("call_user", (data) => {
            console.log("📞 Call initiated by:", data.fromName, "To:", data.receiverId);
            const receiverSocketId = (0, exports.getReceiverSocketId)(data.receiverId);
            console.log("🎯 Receiver Socket ID found:", receiverSocketId);
            if (receiverSocketId) {
                // Forward the call request to the receiver
                io.to(receiverSocketId).emit("incoming_call", {
                    fromId: data.fromId,
                    fromName: data.fromName,
                    callType: data.callType
                });
            }
        });
        // 2. Accept Call: Listen for the receiver accepting the call
        socket.on("accept_call", (data) => {
            const receiverSocketId = (0, exports.getReceiverSocketId)(data.toId);
            if (receiverSocketId) {
                // Forward the receiver's PeerJS ID to the caller to establish P2P connection
                io.to(receiverSocketId).emit("call_accepted", { peerId: data.peerId });
            }
        });
        // 3. Reject Call: Listen for the receiver declining the call
        socket.on("reject_call", (data) => {
            const receiverSocketId = (0, exports.getReceiverSocketId)(data.toId);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("call_rejected");
            }
        });
        // 4. End Call: Listen for any party ending the active call
        socket.on("end_call", (data) => {
            const receiverSocketId = (0, exports.getReceiverSocketId)(data.toId);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("call_ended");
            }
        });
        // ----------------------------------------------------
        // HANDLE DISCONNECT LOGIC
        // ----------------------------------------------------
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
                    await prisma_1.prisma.user.update({
                        where: { id: userId },
                        data: {
                            isOnline: false,
                            lastSeen: new Date(),
                        },
                    });
                    socket.broadcast.emit("user_status_changed", {
                        userId,
                        isOnline: false,
                        lastSeen: new Date(),
                    });
                    console.log(`❌ User ${userId} is now OFFLINE`);
                }
                catch (error) {
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
exports.initSocket = initSocket;
const getIo = () => {
    if (!io) {
        throw new Error("Socket.io is not initialized!");
    }
    return io;
};
exports.getIo = getIo;

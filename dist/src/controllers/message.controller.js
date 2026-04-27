"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageController = void 0;
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const message_service_1 = require("../services/message.service");
const AppError_1 = __importDefault(require("../utils/AppError"));
const prisma_1 = require("../../lib/prisma");
const socket_1 = require("../../lib/socket");
// 🔴 Helper function to check blocks before sending message
const checkBlockBeforeSending = async (senderId, conversationId) => {
    const conversation = await prisma_1.prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { users: true },
    });
    const receiver = conversation?.users.find((u) => u.id !== senderId);
    if (receiver) {
        const sender = await prisma_1.prisma.user.findUnique({
            where: { id: senderId },
            include: { blockedUsers: true, blockedBy: true }
        });
        const isBlocked = sender?.blockedUsers.some(u => u.id === receiver.id) || sender?.blockedBy.some(u => u.id === receiver.id);
        if (isBlocked)
            throw new AppError_1.default(403, 'Cannot send message. Blocked.');
    }
    return conversation;
};
const sendTextMessage = (0, catchAsync_1.default)(async (req, res) => {
    const { conversationId, body, type } = req.body;
    const user = req.user;
    // 🔴 Block Guard
    const conversation = await checkBlockBeforeSending(user.id, conversationId);
    const result = await message_service_1.messageService.sendMessage({
        body,
        senderId: user.id,
        conversationId,
        type: type || 'TEXT',
    });
    if (conversation) {
        const receivers = conversation.users.filter((u) => u.id !== user.id);
        receivers.forEach((receiver) => {
            const receiverSocketId = (0, socket_1.getReceiverSocketId)(receiver.id);
            if (receiverSocketId) {
                const io = (0, socket_1.getIo)();
                io.to(receiverSocketId).emit('new_message', result);
            }
        });
    }
    res.status(201).json({ success: true, message: 'Message sent successfully', data: result });
});
const sendFileMessage = (0, catchAsync_1.default)(async (req, res) => {
    const { conversationId, body } = req.body;
    const request = req;
    const user = request.user;
    if (!request.file) {
        throw new AppError_1.default(400, 'File upload failed');
    }
    // 🔴 Block Guard
    const conversation = await checkBlockBeforeSending(user.id, conversationId);
    const fileUrl = request.file.path;
    const fileType = request.file.mimetype.split('/')[0].toUpperCase();
    const result = await message_service_1.messageService.sendMessage({
        body,
        fileUrl,
        fileType,
        senderId: user.id,
        conversationId,
        type: 'FILE',
    });
    if (conversation) {
        const receivers = conversation.users.filter((u) => u.id !== user.id);
        receivers.forEach((receiver) => {
            const receiverSocketId = (0, socket_1.getReceiverSocketId)(receiver.id);
            if (receiverSocketId) {
                const io = (0, socket_1.getIo)();
                io.to(receiverSocketId).emit('new_message', result);
            }
        });
    }
    res.status(201).json({ success: true, message: 'File sent successfully', data: result });
});
const getMessages = (0, catchAsync_1.default)(async (req, res) => {
    const { conversationId } = req.query;
    const user = req.user;
    if (!conversationId || typeof conversationId !== 'string') {
        throw new AppError_1.default(400, 'Conversation ID is required');
    }
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 50;
    const result = await message_service_1.messageService.getMessages(conversationId, user.id, page, limit);
    res.status(200).json({ success: true, message: 'Messages fetched successfully', data: result });
});
const deleteForMe = (0, catchAsync_1.default)(async (req, res) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const user = req.user;
    await message_service_1.messageService.deleteForMe(id, user.id);
    res.status(200).json({ success: true, message: 'Message deleted for you' });
});
const deleteForEveryone = (0, catchAsync_1.default)(async (req, res) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const user = req.user;
    const result = await message_service_1.messageService.deleteForEveryone(id, user.id);
    res.status(200).json({ success: true, message: 'Message deleted for everyone', data: result });
});
const markAsSeen = (0, catchAsync_1.default)(async (req, res) => {
    const { conversationId } = req.body;
    const user = req.user;
    await message_service_1.messageService.markAsSeen(conversationId, user.id);
    res.status(200).json({ success: true, message: 'Messages marked as seen' });
});
// 🔴 Get Shared Media API
const getSharedMedia = (0, catchAsync_1.default)(async (req, res) => {
    const { conversationId } = req.params;
    const user = req.user;
    if (!conversationId)
        throw new AppError_1.default(400, 'Conversation ID is required');
    const mediaMessages = await prisma_1.prisma.message.findMany({
        where: {
            conversationId: Array.isArray(conversationId) ? conversationId[0] : conversationId,
            fileUrl: { not: null },
            NOT: { deletedFor: { has: user.id } } // Exclude deleted messages
        },
        select: {
            id: true,
            fileUrl: true,
            fileType: true,
            createdAt: true
        },
        orderBy: {
            createdAt: 'desc'
        }
    });
    res.status(200).json({ success: true, data: mediaMessages });
});
exports.messageController = {
    sendTextMessage,
    sendFileMessage,
    getMessages,
    deleteForMe,
    deleteForEveryone,
    markAsSeen,
    getSharedMedia
};

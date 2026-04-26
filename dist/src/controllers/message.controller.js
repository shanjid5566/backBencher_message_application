"use strict";
// import { Request, Response } from 'express';
// import catchAsync from '../utils/catchAsync';
// import { messageService } from '../services/message.service';
// import AppError from '../utils/AppError';
// import { prisma } from '../../lib/prisma';
// import { getIo, getReceiverSocketId } from '../../lib/socket';
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
const sendTextMessage = (0, catchAsync_1.default)(async (req, res) => {
    const { conversationId, body } = req.body;
    const user = req.user;
    // 1. Save message to database
    const result = await message_service_1.messageService.sendMessage({
        body,
        senderId: user.id,
        conversationId,
        type: 'TEXT',
    });
    // 2. REAL-TIME SOCKET LOGIC
    const conversation = await prisma_1.prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { users: true },
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
    // 3. Send API response
    res.status(201).json({
        success: true,
        message: 'Message sent successfully',
        data: result,
    });
});
const sendFileMessage = (0, catchAsync_1.default)(async (req, res) => {
    const { conversationId, body } = req.body;
    const request = req;
    const user = request.user;
    if (!request.file) {
        throw new AppError_1.default(400, 'File upload failed');
    }
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
    // 2. REAL-TIME SOCKET LOGIC
    const conversation = await prisma_1.prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { users: true },
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
    res.status(201).json({
        success: true,
        message: 'File sent successfully',
        data: result,
    });
});
const getMessages = (0, catchAsync_1.default)(async (req, res) => {
    const { conversationId } = req.query;
    const user = req.user;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 50;
    const result = await message_service_1.messageService.getMessages(conversationId, user.id, page, limit);
    res.status(200).json({
        success: true,
        message: 'Messages fetched successfully',
        data: result,
    });
});
const deleteForMe = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const user = req.user;
    await message_service_1.messageService.deleteForMe(id, user.id);
    res.status(200).json({ success: true, message: 'Message deleted for you' });
});
const deleteForEveryone = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
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
exports.messageController = {
    sendTextMessage,
    sendFileMessage,
    getMessages,
    deleteForMe,
    deleteForEveryone,
    markAsSeen,
};

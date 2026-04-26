"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.conversationController = void 0;
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const conversation_service_1 = require("../services/conversation.service");
const createConversation = (0, catchAsync_1.default)(async (req, res) => {
    const { participantId } = req.body;
    const user = req.user;
    const conversation = await conversation_service_1.conversationService.createOrGetConversation(user.id, participantId);
    res.status(200).json({
        success: true,
        message: 'Conversation fetched/created successfully',
        data: conversation,
    });
});
const getConversations = (0, catchAsync_1.default)(async (req, res) => {
    const user = req.user;
    const conversations = await conversation_service_1.conversationService.getUserConversations(user.id);
    res.status(200).json({
        success: true,
        message: 'Conversations retrieved successfully',
        data: conversations,
    });
});
exports.conversationController = {
    createConversation,
    getConversations
};

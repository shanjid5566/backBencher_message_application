"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageQuerySchema = exports.sendFileMessageSchema = exports.sendTextMessageSchema = void 0;
const joi_1 = __importDefault(require("joi"));
// Validation for sending a plain text message
exports.sendTextMessageSchema = joi_1.default.object({
    body: joi_1.default.string().trim().min(1).max(5000).required().messages({
        'string.empty': 'Message body cannot be empty',
        'any.required': 'Message body is required',
    }),
    conversationId: joi_1.default.string().required().messages({
        'any.required': 'conversationId is required',
    }),
});
// Validation for sending a message with a file attachment
exports.sendFileMessageSchema = joi_1.default.object({
    body: joi_1.default.string().max(5000).allow('').optional(),
    conversationId: joi_1.default.string().required().messages({
        'any.required': 'conversationId is required',
    }),
});
// Validation for fetching messages with pagination parameters
exports.messageQuerySchema = joi_1.default.object({
    page: joi_1.default.number().integer().min(1).default(1),
    limit: joi_1.default.number().integer().min(1).max(100).default(20),
    conversationId: joi_1.default.string().required().messages({
        'any.required': 'conversationId is required to fetch history',
    }),
});

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createConversationSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.createConversationSchema = joi_1.default.object({
    participantId: joi_1.default.string().required().messages({
        'any.required': 'participantId is required to start a chat',
        'string.empty': 'participantId cannot be empty',
    }),
});

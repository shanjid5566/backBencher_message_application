"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.conversationRoutes = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validateRequest_1 = require("../middleware/validateRequest");
const conversation_controller_1 = require("../controllers/conversation.controller");
const conversation_schema_1 = require("../schemas/conversation.schema");
const router = (0, express_1.Router)();
// Route to get all conversations of the logged-in user (Inbox)
router.get('/', auth_middleware_1.protect, conversation_controller_1.conversationController.getConversations);
// Route to create a new 1-to-1 conversation or get an existing one
router.post('/', auth_middleware_1.protect, (0, validateRequest_1.validateRequest)(conversation_schema_1.createConversationSchema, 'body'), conversation_controller_1.conversationController.createConversation);
exports.conversationRoutes = router;

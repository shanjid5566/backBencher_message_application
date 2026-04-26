"use strict";
// import { Router } from "express";
// import { protect } from "../middleware/auth.middleware";
// import { messageController } from "../controllers/message.controller";
// import { upload } from "../middleware/upload.middleware";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageRoutes = void 0;
// const router = Router();
// // Fetch message history for a specific conversation with pagination
// router.get("/", protect, messageController.getMessages);
// // Send a standard text message
// router.post("/send-text", protect, messageController.sendTextMessage);
// // Send a message containing a file or image
// router.post(
//   "/send-file",
//   protect,
//   upload.single("file"),
//   messageController.sendFileMessage,
// );
// export const messageRoutes = router;
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const message_controller_1 = require("../controllers/message.controller");
const upload_middleware_1 = require("../middleware/upload.middleware");
const router = (0, express_1.Router)();
// Fetch message history for a specific conversation with pagination
router.get("/", auth_middleware_1.protect, message_controller_1.messageController.getMessages);
// Send a standard text message
router.post("/send-text", auth_middleware_1.protect, message_controller_1.messageController.sendTextMessage);
// Send a message containing a file or image
router.post("/send-file", auth_middleware_1.protect, upload_middleware_1.upload.single("file"), message_controller_1.messageController.sendFileMessage);
// New Routes for Status and Deletion
router.patch("/seen", auth_middleware_1.protect, message_controller_1.messageController.markAsSeen);
router.delete("/:id/for-me", auth_middleware_1.protect, message_controller_1.messageController.deleteForMe);
router.delete("/:id/for-everyone", auth_middleware_1.protect, message_controller_1.messageController.deleteForEveryone);
exports.messageRoutes = router;

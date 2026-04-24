import { Router } from "express";
import { protect } from "../middleware/auth.middleware";
import { messageController } from "../controllers/message.controller";
import { upload } from "../middleware/upload.middleware";

const router = Router();

// Fetch message history for a specific conversation with pagination
router.get("/", protect, messageController.getMessages);

// Send a standard text message
router.post("/send-text", protect, messageController.sendTextMessage);

// Send a message containing a file or image
router.post(
  "/send-file",
  protect,
  upload.single("file"),
  messageController.sendFileMessage,
);

export const messageRoutes = router;

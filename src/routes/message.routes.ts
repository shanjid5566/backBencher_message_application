import { Router } from 'express';
import { upload } from '../config/cloudinary.config';
import { messageController } from '../controllers/message.controller';
import { validateRequest } from '../middleware/validateRequest';
import { protect } from '../middleware/auth.middleware';
import { 
  sendFileMessageSchema, 
  sendTextMessageSchema, 
  messageQuerySchema 
} from '../schemas/message.schema';

const router = Router();

// Route for sending text-only messages
router.post(
  '/send-text',
  protect,
  validateRequest(sendTextMessageSchema, 'body'),
  messageController.sendTextMessage
);

// Route for sending files (Images/Videos/Docs)
router.post(
  '/send-file',
  protect,
  upload.single('file'),
  validateRequest(sendFileMessageSchema, 'body'),
  messageController.sendFileMessage
);

// Route for fetching messages with query validation
router.get(
  '/',
  protect,
  validateRequest(messageQuerySchema, 'query'),
  messageController.getMessages
);

export const messageRoutes = router;
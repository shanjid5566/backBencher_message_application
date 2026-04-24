import { Router } from 'express';
import { upload } from '../config/cloudinary.config';
import { messageController } from '../controllers/message.controller';
import { validateRequest } from '../middleware/validateRequest';
import { protect } from '../middleware/auth.middleware';
import { sendFileMessageSchema, sendTextMessageSchema } from '../schemas/message.schema';

const router = Router();

// Route for text messages (Requires Authentication + Joi Validation)
router.post(
  '/send-text',
  protect,
  validateRequest(sendTextMessageSchema),
  messageController.sendTextMessage
);

// Route for file messages (Requires Authentication + Cloudinary + Joi Validation)
router.post(
  '/send-file',
  protect,
  upload.single('file'),
  validateRequest(sendFileMessageSchema),
  messageController.sendFileMessage
);

export const messageRoutes = router;
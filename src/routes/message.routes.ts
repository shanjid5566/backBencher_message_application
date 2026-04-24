import { Router } from 'express';
import { upload } from '../config/cloudinary.config';
import { messageController } from '../controllers/message.controller';
import { validateRequest } from '../middleware/validateRequest';
import { sendFileMessageSchema } from '../schemas/message.schema';

const router = Router();

router.post(
  '/send-file',
  validateRequest(sendFileMessageSchema, 'body'),
  upload.single('file'),
  messageController.sendFileMessage
);

export const messageRoutes = router;
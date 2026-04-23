import { Router } from 'express';
import { upload } from '../config/cloudinary.config';
import { messageController } from '../controllers/message.controller';

const router = Router();

router.post(
  '/send-file',
  upload.single('file'), // Multer-এর জন্য কী নাম
  messageController.sendFileMessage
);

export const messageRoutes = router;
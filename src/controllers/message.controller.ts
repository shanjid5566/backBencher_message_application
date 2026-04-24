import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import { messageService } from '../services/message.service';
import AppError from '../utils/AppError';

type RequestWithFile = Request & {
  file?: {
    path: string;
    mimetype: string;
  };
};

const sendFileMessage = catchAsync(async (req: Request, res: Response) => {
  const { senderId, conversationId, body } = req.body;
  const request = req as RequestWithFile;

  // Validated by Joi middleware, but add additional file validation
  if (!request.file) {
    throw new AppError(400, 'File upload failed or no file provided');
  }

  // req.file is populated by Cloudinary Multer middleware
  const fileUrl = request.file.path;
  const fileType = request.file.mimetype.split('/')[0].toUpperCase(); // IMAGE, VIDEO, etc.

  const result = await messageService.sendMessage({
    body,
    fileUrl,
    fileType,
    senderId,
    conversationId,
  });

  res.status(201).json({
    success: true,
    message: 'Message sent successfully',
    data: result,
  });
});

export const messageController = {
  sendFileMessage,
};
import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import { messageService } from '../services/message.service';
import AppError from '../utils/AppError';

type RequestWithUserAndFile = Request & {
  user?: { id: string };
  file?: {
    path: string;
    mimetype: string;
  };
};

const sendTextMessage = catchAsync(async (req: Request, res: Response) => {
  const { conversationId, body } = req.body;
  const user = (req as RequestWithUserAndFile).user;

  const result = await messageService.sendMessage({
    body,
    senderId: user!.id,
    conversationId,
  });

  res.status(201).json({
    success: true,
    message: 'Text message sent successfully',
    data: result,
  });
});

const sendFileMessage = catchAsync(async (req: Request, res: Response) => {
  const { conversationId, body } = req.body;
  const request = req as RequestWithUserAndFile;
  const user = request.user;

  if (!request.file) {
    throw new AppError(400, 'File upload failed or no file provided');
  }

  const fileUrl = request.file.path;
  const fileType = request.file.mimetype.split('/')[0].toUpperCase();

  const result = await messageService.sendMessage({
    body,
    fileUrl,
    fileType,
    senderId: user!.id, // Securely getting ID from session
    conversationId,
  });

  res.status(201).json({
    success: true,
    message: 'File message sent successfully',
    data: result,
  });
});

const getMessages = catchAsync(async (req: Request, res: Response) => {
    // Logic for fetching messages using req.query (validated by Joi)
    // Implementation depends on your service layer
});

export const messageController = {
  sendTextMessage,
  sendFileMessage,
  getMessages
};
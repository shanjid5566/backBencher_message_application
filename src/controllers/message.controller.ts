import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import { messageService } from '../services/message.service';
import AppError from '../utils/AppError';

// Extending Request type to include user and file info
type AuthenticatedRequest = Request & {
  user?: { id: string };
  file?: { path: string; mimetype: string };
};

const sendTextMessage = catchAsync(async (req: Request, res: Response) => {
  const { conversationId, body } = req.body;
  const user = (req as AuthenticatedRequest).user;

  const result = await messageService.sendMessage({
    body,
    senderId: user!.id, // Securely pulled from the authenticated session
    conversationId,
  });

  res.status(201).json({
    success: true,
    message: 'Message sent successfully',
    data: result,
  });
});

const sendFileMessage = catchAsync(async (req: Request, res: Response) => {
  const { conversationId, body } = req.body;
  const request = req as AuthenticatedRequest;
  const user = request.user;

  if (!request.file) {
    throw new AppError(400, 'File upload failed');
  }

  const fileUrl = request.file.path;
  const fileType = request.file.mimetype.split('/')[0].toUpperCase();

  const result = await messageService.sendMessage({
    body,
    fileUrl,
    fileType,
    senderId: user!.id,
    conversationId,
  });

  res.status(201).json({
    success: true,
    message: 'File sent successfully',
    data: result,
  });
});

export const messageController = {
  sendTextMessage,
  sendFileMessage,
};
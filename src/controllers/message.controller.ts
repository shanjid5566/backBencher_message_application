import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import { messageService } from '../services/message.service';
import AppError from '../utils/AppError';
import { prisma } from '../../lib/prisma';
import { getIo, getReceiverSocketId } from '../../lib/socket'; // 👈 Import socket utilities

type AuthenticatedRequest = Request & {
  user?: { id: string };
  file?: { path: string; mimetype: string };
};

const sendTextMessage = catchAsync(async (req: Request, res: Response) => {
  const { conversationId, body } = req.body;
  const user = (req as AuthenticatedRequest).user;

  // 1. Save message to database
  const result = await messageService.sendMessage({
    body,
    senderId: user!.id,
    conversationId,
  });

  // 2. REAL-TIME SOCKET LOGIC
  // Fetch the conversation to find who else is in this chat (to send them the message)
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { users: true },
  });

  if (conversation) {
    // Find all users in this conversation EXCEPT the sender
    const receivers = conversation.users.filter((u) => u.id !== user!.id);

    // Loop through receivers (useful if it's a group chat)
    receivers.forEach((receiver) => {
      const receiverSocketId = getReceiverSocketId(receiver.id);
      
      // If the receiver is online, emit the message directly to them
      if (receiverSocketId) {
        const io = getIo();
        io.to(receiverSocketId).emit('new_message', result);
      }
    });
  }

  // 3. Send API response
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

  // 2. REAL-TIME SOCKET LOGIC (Same as text message)
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { users: true },
  });

  if (conversation) {
    const receivers = conversation.users.filter((u) => u.id !== user!.id);
    receivers.forEach((receiver) => {
      const receiverSocketId = getReceiverSocketId(receiver.id);
      if (receiverSocketId) {
        const io = getIo();
        io.to(receiverSocketId).emit('new_message', result);
      }
    });
  }

  res.status(201).json({
    success: true,
    message: 'File sent successfully',
    data: result,
  });
});
const getMessages = catchAsync(async (req: Request, res: Response) => {
  // Query parameters are already validated by Joi (messageQuerySchema)
  const { conversationId, page, limit } = req.query as any;

  const result = await messageService.getMessages(
    conversationId,
    parseInt(page),
    parseInt(limit)
  );

  res.status(200).json({
    success: true,
    message: 'Messages fetched successfully',
    data: result,
  });
});
export const messageController = {
  sendTextMessage,
  sendFileMessage,
  getMessages,
};
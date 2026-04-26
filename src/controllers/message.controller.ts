import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import { messageService } from '../services/message.service';
import AppError from '../utils/AppError';
import { prisma } from '../../lib/prisma';
import { getIo, getReceiverSocketId } from '../../lib/socket';

type AuthenticatedRequest = Request & {
  user?: { id: string };
  file?: { path: string; mimetype: string };
};

// 🔴 Helper function to check blocks before sending message
const checkBlockBeforeSending = async (senderId: string, conversationId: string) => {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { users: true },
  });
  
  const receiver = conversation?.users.find((u) => u.id !== senderId);
  
  if (receiver) {
    const sender = await prisma.user.findUnique({
      where: { id: senderId },
      include: { blockedUsers: true, blockedBy: true }
    });
    
    const isBlocked = sender?.blockedUsers.some(u => u.id === receiver.id) || sender?.blockedBy.some(u => u.id === receiver.id);
    if (isBlocked) throw new AppError(403, 'Cannot send message. Blocked.');
  }
  
  return conversation;
};

const sendTextMessage = catchAsync(async (req: Request, res: Response) => {
  const { conversationId, body, type } = req.body;
  const user = (req as AuthenticatedRequest).user;

  // 🔴 Block Guard
  const conversation = await checkBlockBeforeSending(user!.id, conversationId);

  const result = await messageService.sendMessage({
    body,
    senderId: user!.id,
    conversationId,
    type: type || 'TEXT',
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

  res.status(201).json({ success: true, message: 'Message sent successfully', data: result });
});

const sendFileMessage = catchAsync(async (req: Request, res: Response) => {
  const { conversationId, body } = req.body;
  const request = req as AuthenticatedRequest;
  const user = request.user;

  if (!request.file) {
    throw new AppError(400, 'File upload failed');
  }

  // 🔴 Block Guard
  const conversation = await checkBlockBeforeSending(user!.id, conversationId);

  const fileUrl = request.file.path;
  const fileType = request.file.mimetype.split('/')[0].toUpperCase();

  const result = await messageService.sendMessage({
    body,
    fileUrl,
    fileType,
    senderId: user!.id,
    conversationId,
    type: 'FILE',
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

  res.status(201).json({ success: true, message: 'File sent successfully', data: result });
});

const getMessages = catchAsync(async (req: Request, res: Response) => {
  const { conversationId } = req.query;
  const user = (req as AuthenticatedRequest).user;

  const page = req.query.page ? parseInt(req.query.page as string) : 1;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

  const result = await messageService.getMessages(
    conversationId as string,
    user!.id,
    page,
    limit
  );

  res.status(200).json({ success: true, message: 'Messages fetched successfully', data: result });
});

const deleteForMe = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = (req as AuthenticatedRequest).user;
  
  await messageService.deleteForMe(id, user!.id);
  res.status(200).json({ success: true, message: 'Message deleted for you' });
});

const deleteForEveryone = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = (req as AuthenticatedRequest).user;
  
  const result = await messageService.deleteForEveryone(id, user!.id);
  res.status(200).json({ success: true, message: 'Message deleted for everyone', data: result });
});

const markAsSeen = catchAsync(async (req: Request, res: Response) => {
  const { conversationId } = req.body;
  const user = (req as AuthenticatedRequest).user;
  
  await messageService.markAsSeen(conversationId, user!.id);
  res.status(200).json({ success: true, message: 'Messages marked as seen' });
});

// 🔴 Get Shared Media API
const getSharedMedia = catchAsync(async (req: Request, res: Response) => {
  const { conversationId } = req.params;
  const user = (req as AuthenticatedRequest).user;

  if (!conversationId) throw new AppError(400, 'Conversation ID is required');

  const mediaMessages = await prisma.message.findMany({
    where: {
      conversationId: conversationId,
      fileUrl: { not: null },
      NOT: { deletedFor: { has: user!.id } } // ডিলিট করা মেসেজ বাদ দেওয়া
    },
    select: {
      id: true,
      fileUrl: true,
      fileType: true,
      createdAt: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  res.status(200).json({ success: true, data: mediaMessages });
});

export const messageController = {
  sendTextMessage,
  sendFileMessage,
  getMessages,
  deleteForMe,
  deleteForEveryone,
  markAsSeen,
  getSharedMedia 
};
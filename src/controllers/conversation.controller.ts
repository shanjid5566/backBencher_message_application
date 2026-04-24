import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import { conversationService } from '../services/conversation.service';

type AuthenticatedRequest = Request & { user?: { id: string } };

const createConversation = catchAsync(async (req: Request, res: Response) => {
  const { participantId } = req.body;
  const user = (req as AuthenticatedRequest).user;

  const conversation = await conversationService.createOrGetConversation(user!.id, participantId);

  res.status(200).json({
    success: true,
    message: 'Conversation fetched/created successfully',
    data: conversation,
  });
});

const getConversations = catchAsync(async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user;

  const conversations = await conversationService.getUserConversations(user!.id);

  res.status(200).json({
    success: true,
    message: 'Conversations retrieved successfully',
    data: conversations,
  });
});

export const conversationController = {
  createConversation,
  getConversations
};
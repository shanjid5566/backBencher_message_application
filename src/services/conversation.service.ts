import { prisma } from '../../lib/prisma';
import AppError from '../utils/AppError';

const createOrGetConversation = async (currentUserId: string, participantId: string) => {
  if (currentUserId === participantId) {
    throw new AppError(400, "You cannot start a conversation with yourself");
  }

  // 1. Check if a 1-on-1 conversation already exists between these two users
  let conversation = await prisma.conversation.findFirst({
    where: {
      isGroup: false,
      AND: [
        { users: { some: { id: currentUserId } } },
        { users: { some: { id: participantId } } }
      ]
    },
    include: {
      users: {
        select: { id: true, name: true, image: true, isOnline: true }
      }
    }
  });

  // 2. If it exists, return it
  if (conversation) {
    return conversation;
  }

  // 3. If it doesn't exist, create a new one
  conversation = await prisma.conversation.create({
    data: {
      isGroup: false,
      users: {
        connect: [
          { id: currentUserId },
          { id: participantId }
        ]
      }
    },
    include: {
      users: {
        select: { id: true, name: true, image: true, isOnline: true }
      }
    }
  });

  return conversation;
};

const getUserConversations = async (userId: string) => {
  // Get all conversations for the current user
  return await prisma.conversation.findMany({
    where: {
      users: { some: { id: userId } }
    },
    include: {
      // Include the OTHER user's details (exclude current user from the list)
      users: {
        where: { id: { not: userId } },
        select: { id: true, name: true, image: true, isOnline: true, lastSeen: true }
      },
      // Include the last message to show in the inbox preview
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    },
    orderBy: {
      updatedAt: 'desc' // Most recently updated conversations first
    }
  });
};

export const conversationService = {
  createOrGetConversation,
  getUserConversations
};
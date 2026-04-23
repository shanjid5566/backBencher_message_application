import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const sendMessage = async (payload: {
  body?: string;
  fileUrl?: string;
  fileType?: string;
  senderId: string;
  conversationId: string;
}) => {
  const result = await prisma.message.create({
    data: {
      body: payload.body,
      fileUrl: payload.fileUrl,
      fileType: payload.fileType,
      senderId: payload.senderId,
      conversationId: payload.conversationId,
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  });

  // Future: Emit socket event here for real-time update
  return result;
};

export const messageService = {
  sendMessage,
};
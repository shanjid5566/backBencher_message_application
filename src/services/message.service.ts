import { prisma } from '../../lib/prisma';

const sendMessage = async (payload: {
  body?: string;
  fileUrl?: string;
  fileType?: string;
  senderId: string;
  conversationId: string;
}) => {
  return await prisma.message.create({
    data: {
      body: payload.body,
      fileUrl: payload.fileUrl,
      fileType: payload.fileType,
      senderId: payload.senderId,
      conversationId: payload.conversationId,
    },
    include: {
      sender: {
        select: { id: true, name: true, image: true },
      },
    },
  });
};

const deleteMessage = async (messageId: string, userId: string) => {
  // This will trigger the global prisma middleware to perform a soft delete
  return await prisma.message.delete({
    where: {
      id: messageId,
      senderId: userId,
    },
  });
};

export const messageService = {
  sendMessage,
  deleteMessage,
};
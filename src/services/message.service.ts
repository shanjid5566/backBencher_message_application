// import { prisma } from "../../lib/prisma";

// const sendMessage = async (payload: {
//   body?: string;
//   fileUrl?: string;
//   fileType?: string;
//   senderId: string;
//   conversationId: string;
// }) => {
//   return await prisma.message.create({
//     data: {
//       body: payload.body,
//       fileUrl: payload.fileUrl,
//       fileType: payload.fileType,
//       senderId: payload.senderId,
//       conversationId: payload.conversationId,
//     },
//     include: {
//       sender: {
//         select: { id: true, name: true, image: true },
//       },
//     },
//   });
// };

// const deleteMessage = async (messageId: string, userId: string) => {
//   // This will trigger the global prisma middleware to perform a soft delete
//   return await prisma.message.delete({
//     where: {
//       id: messageId,
//       senderId: userId,
//     },
//   });
// };

// const getMessages = async (
//   conversationId: string,
//   page: number = 1,
//   limit: number = 20,
// ) => {
//   const skip = (page - 1) * limit;

//   // 1. Fetch paginated messages
//   const messages = await prisma.message.findMany({
//     where: {
//       conversationId: conversationId,
//     },
//     include: {
//       sender: {
//         select: { id: true, name: true, image: true },
//       },
//     },
//     orderBy: {
//       createdAt: "asc", // Chronological order: oldest at top, newest at bottom
//     },
//     take: limit,
//     skip: skip,
//   });

//   // 2. Get total count for frontend pagination logic (e.g. "Load More" button)
//   const totalMessages = await prisma.message.count({
//     where: { conversationId: conversationId },
//   });

//   return {
//     messages,
//     pagination: {
//       total: totalMessages,
//       page,
//       limit,
//       totalPages: Math.ceil(totalMessages / limit),
//       hasNextPage: page * limit < totalMessages,
//     },
//   };
// };
// export const messageService = {
//   sendMessage,
//   deleteMessage,
//   getMessages,
// };










import { prisma } from "../../lib/prisma";
import { MessageType } from "@prisma/client";

const sendMessage = async (payload: {
  body?: string;
  fileUrl?: string;
  fileType?: string;
  senderId: string;
  conversationId: string;
  type?: MessageType;
}) => {
  return await prisma.message.create({
    data: {
      body: payload.body,
      fileUrl: payload.fileUrl,
      fileType: payload.fileType,
      senderId: payload.senderId,
      conversationId: payload.conversationId,
      type: payload.type || 'TEXT',
      status: 'SENT',
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

// 🆕 Delete for Me (hide message only for current user)
const deleteForMe = async (messageId: string, userId: string) => {
  return await prisma.message.update({
    where: { id: messageId },
    data: {
      deletedFor: { push: userId },
    },
  });
};

// 🆕 Delete for Everyone (delete for all users)
const deleteForEveryone = async (messageId: string, userId: string) => {
  return await prisma.message.delete({
    where: { 
      id: messageId,
      senderId: userId 
    },
  });
};

// 🆕 Mark Messages as Seen
const markAsSeen = async (conversationId: string, userId: string) => {
  return await prisma.message.updateMany({
    where: {
      conversationId,
      senderId: { not: userId }, 
      status: { not: 'SEEN' },
    },
    data: { status: 'SEEN' },
  });
};

const getMessages = async (
  conversationId: string,
  userId: string,
  page: number = 1,
  limit: number = 20,
) => {
  const skip = (page - 1) * limit;

  // 1. Fetch paginated messages
  const messages = await prisma.message.findMany({
    where: {
      conversationId: conversationId,
      NOT: { deletedFor: { has: userId } }, // 👈 Exclude messages deleted for current user
    },
    include: {
      sender: {
        select: { id: true, name: true, image: true },
      },
    },
    orderBy: {
      createdAt: "asc", 
    },
    take: limit,
    skip: skip,
  });

  // 2. Get total count for frontend pagination logic
  const totalMessages = await prisma.message.count({
    where: { 
      conversationId: conversationId,
      NOT: { deletedFor: { has: userId } }
    },
  });

  return {
    messages,
    pagination: {
      total: totalMessages,
      page,
      limit,
      totalPages: Math.ceil(totalMessages / limit),
      hasNextPage: page * limit < totalMessages,
    },
  };
};

export const messageService = {
  sendMessage,
  deleteMessage,
  getMessages,
  deleteForMe,
  deleteForEveryone,
  markAsSeen,
};
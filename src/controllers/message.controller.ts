// import { Request, Response } from 'express';
// import catchAsync from '../utils/catchAsync';
// import { messageService } from '../services/message.service';
// import AppError from '../utils/AppError';
// import { prisma } from '../../lib/prisma';
// import { getIo, getReceiverSocketId } from '../../lib/socket';

// type AuthenticatedRequest = Request & {
//   user?: { id: string };
//   file?: { path: string; mimetype: string };
// };

// const sendTextMessage = catchAsync(async (req: Request, res: Response) => {
//   const { conversationId, body } = req.body;
//   const user = (req as AuthenticatedRequest).user;

//   // 1. Save message to database
//   const result = await messageService.sendMessage({
//     body,
//     senderId: user!.id,
//     conversationId,
//   });

//   // 2. REAL-TIME SOCKET LOGIC
//   const conversation = await prisma.conversation.findUnique({
//     where: { id: conversationId },
//     include: { users: true },
//   });

//   if (conversation) {
//     const receivers = conversation.users.filter((u) => u.id !== user!.id);
//     console.log(`📤 Broadcasting message to ${receivers.length} receivers in conversation ${conversationId}`);

//     receivers.forEach((receiver) => {
//       const receiverSocketId = getReceiverSocketId(receiver.id);
//       console.log(`📍 Checking receiver ${receiver.id}: Socket ID = ${receiverSocketId || 'NOT_CONNECTED'}`);
      
//       if (receiverSocketId) {
//         const io = getIo();
//         io.to(receiverSocketId).emit('new_message', result);
//         console.log(`✅ Message emitted to receiver ${receiver.id}`);
//       }
//     });
//   }

//   // 3. Send API response
//   res.status(201).json({
//     success: true,
//     message: 'Message sent successfully',
//     data: result,
//   });
// });

// const sendFileMessage = catchAsync(async (req: Request, res: Response) => {
//   const { conversationId, body } = req.body;
//   const request = req as AuthenticatedRequest;
//   const user = request.user;

//   if (!request.file) {
//     throw new AppError(400, 'File upload failed');
//   }

//   const fileUrl = request.file.path;
//   const fileType = request.file.mimetype.split('/')[0].toUpperCase();

//   const result = await messageService.sendMessage({
//     body,
//     fileUrl,
//     fileType,
//     senderId: user!.id,
//     conversationId,
//   });

//   // 2. REAL-TIME SOCKET LOGIC
//   const conversation = await prisma.conversation.findUnique({
//     where: { id: conversationId },
//     include: { users: true },
//   });

//   if (conversation) {
//     const receivers = conversation.users.filter((u) => u.id !== user!.id);
//     receivers.forEach((receiver) => {
//       const receiverSocketId = getReceiverSocketId(receiver.id);
//       if (receiverSocketId) {
//         const io = getIo();
//         io.to(receiverSocketId).emit('new_message', result);
//       }
//     });
//   }

//   res.status(201).json({
//     success: true,
//     message: 'File sent successfully',
//     data: result,
//   });
// });

// const getMessages = catchAsync(async (req: Request, res: Response) => {
//   const { conversationId } = req.query;

//   // 👇 এখানেই মূল ফিক্সটি করা হয়েছে (Default parameters)
//   const page = req.query.page ? parseInt(req.query.page as string) : 1;
//   const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

//   const result = await messageService.getMessages(
//     conversationId as string,
//     page,
//     limit
//   );

//   res.status(200).json({
//     success: true,
//     message: 'Messages fetched successfully',
//     data: result,
//   });
// });

// export const messageController = {
//   sendTextMessage,
//   sendFileMessage,
//   getMessages,
// };



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

const sendTextMessage = catchAsync(async (req: Request, res: Response) => {
  const { conversationId, body } = req.body;
  const user = (req as AuthenticatedRequest).user;

  // 1. Save message to database
  const result = await messageService.sendMessage({
    body,
    senderId: user!.id,
    conversationId,
    type: 'TEXT',
  });

  // 2. REAL-TIME SOCKET LOGIC
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
    type: 'FILE',
  });

  // 2. REAL-TIME SOCKET LOGIC
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

  res.status(200).json({
    success: true,
    message: 'Messages fetched successfully',
    data: result,
  });
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

export const messageController = {
  sendTextMessage,
  sendFileMessage,
  getMessages,
  deleteForMe,
  deleteForEveryone,
  markAsSeen,
};
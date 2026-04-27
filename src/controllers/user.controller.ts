import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import { prisma } from '../../lib/prisma';
import AppError from '../utils/AppError';
import { hashPassword, verifyPassword } from '@better-auth/utils/password';
import { getIo, getReceiverSocketId } from '../../lib/socket'; // 👈 Added socket imports

type AuthenticatedRequest = Request & {
  user?: { id: string };
  file?: { path: string; mimetype: string };
};

const searchUsers = catchAsync(async (req: Request, res: Response) => {
  const { q } = req.query;
  const currentUserId = (req as any).user.id;

  if (!q) return res.status(200).json({ success: true, data: [] });

  const users = await prisma.user.findMany({
    where: {
      id: { not: currentUserId },
      OR: [
        { name: { contains: q as string, mode: 'insensitive' } },
        { email: { contains: q as string, mode: 'insensitive' } }
      ]
    },
    select: { id: true, name: true, image: true, isOnline: true },
    take: 10
  });

  res.status(200).json({ success: true, data: users });
});

const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const userReq = req as AuthenticatedRequest;
  const userId = userReq.user?.id;
  const { name } = req.body;

  if (!userId) throw new AppError(401, 'Unauthorized');

  const updateData: any = {};
  if (name) updateData.name = name;
  if (userReq.file) updateData.image = userReq.file.path;

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: { id: true, name: true, email: true, image: true }
  });

  res.status(200).json({ success: true, message: 'Profile updated successfully', data: updatedUser });
});

const changePassword = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as AuthenticatedRequest).user?.id;
  const { currentPassword, newPassword } = req.body;

  if (!userId) throw new AppError(401, 'Unauthorized');
  if (!currentPassword || !newPassword) throw new AppError(400, 'Please provide both current and new passwords');

  const account = await prisma.account.findFirst({ where: { userId } });
  
  if (!account || !account.password) {
    throw new AppError(400, 'No password set for this account (maybe you logged in with Google/GitHub)');
  }

  const isMatch = await verifyPassword(account.password, currentPassword);
  if (!isMatch) throw new AppError(400, 'Incorrect current password');

  const hashedNewPassword = await hashPassword(newPassword);
  await prisma.account.update({
    where: { id: account.id },
    data: { password: hashedNewPassword }
  });

  res.status(200).json({ success: true, message: 'Password changed successfully' });
});

// 🔴 🆕 Check Block Status API (to inform the frontend whether blocking exists)
const checkBlockStatus = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as AuthenticatedRequest).user?.id;
  const { targetUserId } = req.params;

  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    include: { blockedUsers: true, blockedBy: true }
  });

  const iBlockedThem = currentUser?.blockedUsers.some(u => u.id === targetUserId) || false;
  const theyBlockedMe = currentUser?.blockedBy.some(u => u.id === targetUserId) || false;

  res.status(200).json({ success: true, data: { iBlockedThem, theyBlockedMe } });
});

// 🔴 🆕 Block User API (with socket event)
const blockUser = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as AuthenticatedRequest).user?.id;
  const { targetUserId } = req.body;

  if (!userId || !targetUserId) throw new AppError(400, 'Missing required IDs');

  // Connect based on Prisma Many-to-Many self-relation
  await prisma.user.update({
    where: { id: userId },
    data: {
      blockedUsers: {
        connect: { id: targetUserId }
      }
    }
  });

  // Notify the other user in real-time
  const targetSocketId = getReceiverSocketId(targetUserId);
  if (targetSocketId) {
    getIo().to(targetSocketId).emit("block_update", { blockerId: userId, action: "block" });
  }

  res.status(200).json({ success: true, message: 'User blocked successfully' });
});

// 🔴 🆕 Unblock User API (with socket event)
const unblockUser = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as AuthenticatedRequest).user?.id;
  const { targetUserId } = req.body;

  if (!userId || !targetUserId) throw new AppError(400, 'Missing required IDs');

  // Disconnect based on Prisma Many-to-Many self-relation
  await prisma.user.update({
    where: { id: userId },
    data: {
      blockedUsers: {
        disconnect: { id: targetUserId }
      }
    }
  });

  // Notify the other user in real-time
  const targetSocketId = getReceiverSocketId(targetUserId);
  if (targetSocketId) {
    getIo().to(targetSocketId).emit("block_update", { blockerId: userId, action: "unblock" });
  }

  res.status(200).json({ success: true, message: 'User unblocked successfully' });
});

export const userController = { searchUsers, updateProfile, changePassword, blockUser, unblockUser, checkBlockStatus };
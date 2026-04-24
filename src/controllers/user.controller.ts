import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import { prisma } from '../../lib/prisma';

const searchUsers = catchAsync(async (req: Request, res: Response) => {
  const { q } = req.query;
  const currentUserId = (req as any).user.id;

  if (!q) {
    return res.status(200).json({ success: true, data: [] });
  }

  // Search users by name or email, ignoring the current logged-in user
  const users = await prisma.user.findMany({
    where: {
      id: { not: currentUserId }, // নিজেকে যেন সার্চ রেজাল্টে না দেখায়
      OR: [
        { name: { contains: q as string, mode: 'insensitive' } },
        { email: { contains: q as string, mode: 'insensitive' } }
      ]
    },
    select: {
      id: true,
      name: true,
      image: true,
      isOnline: true
    },
    take: 10 // একসাথে সর্বোচ্চ ১০ জনকে দেখাবে
  });

  res.status(200).json({
    success: true,
    data: users,
  });
});

export const userController = { searchUsers };
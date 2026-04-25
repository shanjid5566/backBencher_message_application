import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import { prisma } from '../../lib/prisma';
import AppError from '../utils/AppError'; // 👈 এরর হ্যান্ডেল করার জন্য এটি ইমপোর্ট করা হলো

// 🆕 ফাইল এবং ইউজার আইডি টাইপ করার জন্য
type AuthenticatedRequest = Request & {
  user?: { id: string };
  file?: { path: string; mimetype: string };
};

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

// 🆕 Update Profile (Name & Profile Picture)
const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const userReq = req as AuthenticatedRequest;
  const userId = userReq.user?.id;
  const { name } = req.body;

  if (!userId) throw new AppError(401, 'Unauthorized');

  // Update object তৈরি করা
  const updateData: any = {};
  
  if (name) {
    updateData.name = name;
  }
  
  if (userReq.file) {
    updateData.image = userReq.file.path; // Cloudinary বা Local Multer URL
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: { id: true, name: true, email: true, image: true }
  });

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: updatedUser
  });
});

export const userController = { searchUsers, updateProfile };
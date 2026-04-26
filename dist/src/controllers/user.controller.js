"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userController = void 0;
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const prisma_1 = require("../../lib/prisma");
const AppError_1 = __importDefault(require("../utils/AppError"));
const password_1 = require("@better-auth/utils/password");
const searchUsers = (0, catchAsync_1.default)(async (req, res) => {
    const { q } = req.query;
    const currentUserId = req.user.id;
    if (!q)
        return res.status(200).json({ success: true, data: [] });
    const users = await prisma_1.prisma.user.findMany({
        where: {
            id: { not: currentUserId },
            OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { email: { contains: q, mode: 'insensitive' } }
            ]
        },
        select: { id: true, name: true, image: true, isOnline: true },
        take: 10
    });
    res.status(200).json({ success: true, data: users });
});
const updateProfile = (0, catchAsync_1.default)(async (req, res) => {
    const userReq = req;
    const userId = userReq.user?.id;
    const { name } = req.body;
    if (!userId)
        throw new AppError_1.default(401, 'Unauthorized');
    const updateData = {};
    if (name)
        updateData.name = name;
    if (userReq.file)
        updateData.image = userReq.file.path;
    const updatedUser = await prisma_1.prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: { id: true, name: true, email: true, image: true }
    });
    res.status(200).json({ success: true, message: 'Profile updated successfully', data: updatedUser });
});
// 🆕 Change Password Logic
const changePassword = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const { currentPassword, newPassword } = req.body;
    if (!userId)
        throw new AppError_1.default(401, 'Unauthorized');
    if (!currentPassword || !newPassword)
        throw new AppError_1.default(400, 'Please provide both current and new passwords');
    // Account টেবিল থেকে ইউজারের পাসওয়ার্ড আনা (আপনার স্কিমা অনুযায়ী)
    const account = await prisma_1.prisma.account.findFirst({ where: { userId } });
    if (!account || !account.password) {
        throw new AppError_1.default(400, 'No password set for this account (maybe you logged in with Google/GitHub)');
    }
    // Better Auth hash format অনুযায়ী verify করতে হবে
    const isMatch = await (0, password_1.verifyPassword)(account.password, currentPassword);
    if (!isMatch)
        throw new AppError_1.default(400, 'Incorrect current password');
    // Better Auth compatible hash তৈরি করে সেভ করা
    const hashedNewPassword = await (0, password_1.hashPassword)(newPassword);
    await prisma_1.prisma.account.update({
        where: { id: account.id },
        data: { password: hashedNewPassword }
    });
    res.status(200).json({ success: true, message: 'Password changed successfully' });
});
exports.userController = { searchUsers, updateProfile, changePassword };

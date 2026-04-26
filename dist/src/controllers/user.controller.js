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
const socket_1 = require("../../lib/socket"); // 👈 Added socket imports
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
const changePassword = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const { currentPassword, newPassword } = req.body;
    if (!userId)
        throw new AppError_1.default(401, 'Unauthorized');
    if (!currentPassword || !newPassword)
        throw new AppError_1.default(400, 'Please provide both current and new passwords');
    const account = await prisma_1.prisma.account.findFirst({ where: { userId } });
    if (!account || !account.password) {
        throw new AppError_1.default(400, 'No password set for this account (maybe you logged in with Google/GitHub)');
    }
    const isMatch = await (0, password_1.verifyPassword)(account.password, currentPassword);
    if (!isMatch)
        throw new AppError_1.default(400, 'Incorrect current password');
    const hashedNewPassword = await (0, password_1.hashPassword)(newPassword);
    await prisma_1.prisma.account.update({
        where: { id: account.id },
        data: { password: hashedNewPassword }
    });
    res.status(200).json({ success: true, message: 'Password changed successfully' });
});
// 🔴 🆕 Check Block Status API (to inform the frontend whether blocking exists)
const checkBlockStatus = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const { targetUserId } = req.params;
    const currentUser = await prisma_1.prisma.user.findUnique({
        where: { id: userId },
        include: { blockedUsers: true, blockedBy: true }
    });
    const iBlockedThem = currentUser?.blockedUsers.some(u => u.id === targetUserId) || false;
    const theyBlockedMe = currentUser?.blockedBy.some(u => u.id === targetUserId) || false;
    res.status(200).json({ success: true, data: { iBlockedThem, theyBlockedMe } });
});
// 🔴 🆕 Block User API (with socket event)
const blockUser = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const { targetUserId } = req.body;
    if (!userId || !targetUserId)
        throw new AppError_1.default(400, 'Missing required IDs');
    // Connect based on Prisma Many-to-Many self-relation
    await prisma_1.prisma.user.update({
        where: { id: userId },
        data: {
            blockedUsers: {
                connect: { id: targetUserId }
            }
        }
    });
    // Notify the other user in real-time
    const targetSocketId = (0, socket_1.getReceiverSocketId)(targetUserId);
    if (targetSocketId) {
        (0, socket_1.getIo)().to(targetSocketId).emit("block_update", { blockerId: userId, action: "block" });
    }
    res.status(200).json({ success: true, message: 'User blocked successfully' });
});
// 🔴 🆕 Unblock User API (with socket event)
const unblockUser = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const { targetUserId } = req.body;
    if (!userId || !targetUserId)
        throw new AppError_1.default(400, 'Missing required IDs');
    // Disconnect based on Prisma Many-to-Many self-relation
    await prisma_1.prisma.user.update({
        where: { id: userId },
        data: {
            blockedUsers: {
                disconnect: { id: targetUserId }
            }
        }
    });
    // Notify the other user in real-time
    const targetSocketId = (0, socket_1.getReceiverSocketId)(targetUserId);
    if (targetSocketId) {
        (0, socket_1.getIo)().to(targetSocketId).emit("block_update", { blockerId: userId, action: "unblock" });
    }
    res.status(200).json({ success: true, message: 'User unblocked successfully' });
});
exports.userController = { searchUsers, updateProfile, changePassword, blockUser, unblockUser, checkBlockStatus };

"use strict";
// import { Request, Response } from "express";
// import catchAsync from "../utils/catchAsync";
// import { callService } from "../services/call.service";
// import AppError from "../utils/AppError";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.callController = void 0;
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const call_service_1 = require("../services/call.service");
const AppError_1 = __importDefault(require("../utils/AppError"));
const prisma_1 = require("../../lib/prisma"); // 👈 For direct save in database
const initiateCall = (0, catchAsync_1.default)(async (req, res) => {
    const { receiverId, conversationId, callType } = req.body;
    const user = req.user;
    if (!receiverId)
        throw new AppError_1.default(400, "Receiver ID is required");
    if (!callType || !["AUDIO", "VIDEO"].includes(callType))
        throw new AppError_1.default(400, "Call type must be AUDIO or VIDEO");
    if (receiverId === user.id)
        throw new AppError_1.default(400, "Cannot call yourself");
    const callLog = await call_service_1.callService.initiateCall({ callerId: user.id, receiverId, conversationId, callType });
    res.status(201).json({ success: true, message: "Call initiated", data: callLog });
});
const acceptCall = (0, catchAsync_1.default)(async (req, res) => {
    const { callId } = req.body;
    const user = req.user;
    if (!callId)
        throw new AppError_1.default(400, "Call ID is required");
    const callLog = await call_service_1.callService.acceptCall(callId, user.id);
    res.status(200).json({ success: true, message: "Call accepted", data: callLog });
});
const rejectCall = (0, catchAsync_1.default)(async (req, res) => {
    const { callId } = req.body;
    if (!callId)
        throw new AppError_1.default(400, "Call ID is required");
    const callLog = await call_service_1.callService.rejectCall(callId);
    res.status(200).json({ success: true, message: "Call rejected", data: callLog });
});
const missedCall = (0, catchAsync_1.default)(async (req, res) => {
    const { callId } = req.body;
    if (!callId)
        throw new AppError_1.default(400, "Call ID is required");
    const callLog = await call_service_1.callService.missedCall(callId);
    res.status(200).json({ success: true, message: "Call marked as missed", data: callLog });
});
const endCall = (0, catchAsync_1.default)(async (req, res) => {
    const { callId, duration, recordingUrl } = req.body;
    if (!callId)
        throw new AppError_1.default(400, "Call ID is required");
    const callLog = await call_service_1.callService.endCall(callId, duration || 0, recordingUrl);
    res.status(200).json({ success: true, message: "Call ended", data: callLog });
});
// 🔴 🆕 1-Step Save Call Log (for direct save when call ends from frontend)
const saveCallLog = (0, catchAsync_1.default)(async (req, res) => {
    const callerId = req.user.id;
    const { receiverId, conversationId, callType, status, duration } = req.body;
    const callLog = await prisma_1.prisma.callLog.create({
        data: {
            callerId,
            receiverId,
            conversationId,
            callType,
            status,
            duration,
            endTime: new Date()
        }
    });
    res.status(201).json({ success: true, data: callLog });
});
// 🔴 🆕 Get Call History (updated to send data with image and name)
const getCallHistory = (0, catchAsync_1.default)(async (req, res) => {
    const user = req.user;
    const calls = await prisma_1.prisma.callLog.findMany({
        where: {
            OR: [
                { callerId: user.id },
                { receiverId: user.id }
            ]
        },
        include: {
            caller: { select: { id: true, name: true, image: true } },
            receiver: { select: { id: true, name: true, image: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 50
    });
    res.status(200).json({ success: true, message: "Call history fetched", data: calls });
});
const getMissedCalls = (0, catchAsync_1.default)(async (req, res) => {
    const user = req.user;
    const missedCalls = await call_service_1.callService.getMissedCalls(user.id);
    res.status(200).json({ success: true, message: "Missed calls fetched", data: missedCalls });
});
exports.callController = { initiateCall, acceptCall, rejectCall, missedCall, endCall, getCallHistory, getMissedCalls, saveCallLog };

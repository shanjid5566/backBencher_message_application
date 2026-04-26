"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.callService = void 0;
const prisma_1 = require("../../lib/prisma");
const initiateCall = async (payload) => {
    const callLog = await prisma_1.prisma.callLog.create({
        data: {
            callType: payload.callType,
            callerId: payload.callerId,
            receiverId: payload.receiverId,
            conversationId: payload.conversationId,
            status: "MISSED",
            startTime: new Date(),
        },
        include: {
            caller: { select: { id: true, name: true, image: true } },
            receiver: { select: { id: true, name: true, image: true } },
        },
    });
    return callLog;
};
const acceptCall = async (callId, receiverId) => {
    const callLog = await prisma_1.prisma.callLog.update({
        where: { id: callId },
        data: { status: "COMPLETED" },
        include: {
            caller: { select: { id: true, name: true, image: true } },
            receiver: { select: { id: true, name: true, image: true } },
        },
    });
    return callLog;
};
const rejectCall = async (callId) => {
    const callLog = await prisma_1.prisma.callLog.update({
        where: { id: callId },
        data: { status: "REJECTED" },
    });
    return callLog;
};
const missedCall = async (callId) => {
    const callLog = await prisma_1.prisma.callLog.update({
        where: { id: callId },
        data: { status: "MISSED" },
    });
    return callLog;
};
const endCall = async (callId, duration, recordingUrl) => {
    const callLog = await prisma_1.prisma.callLog.update({
        where: { id: callId },
        data: {
            endTime: new Date(),
            duration,
            recordingUrl: recordingUrl || null,
            status: "COMPLETED",
        },
        include: {
            caller: { select: { id: true, name: true, image: true } },
            receiver: { select: { id: true, name: true, image: true } },
        },
    });
    return callLog;
};
const getCallHistory = async (userId, limit = 20) => {
    const calls = await prisma_1.prisma.callLog.findMany({
        where: {
            OR: [{ callerId: userId }, { receiverId: userId }],
        },
        include: {
            caller: { select: { id: true, name: true, image: true } },
            receiver: { select: { id: true, name: true, image: true } },
            conversation: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
    });
    return calls;
};
const getMissedCalls = async (userId) => {
    const missedCalls = await prisma_1.prisma.callLog.findMany({
        where: { receiverId: userId, status: "MISSED" },
        include: { caller: { select: { id: true, name: true, image: true } } },
        orderBy: { createdAt: "desc" },
    });
    return missedCalls;
};
exports.callService = { initiateCall, acceptCall, rejectCall, missedCall, endCall, getCallHistory, getMissedCalls };

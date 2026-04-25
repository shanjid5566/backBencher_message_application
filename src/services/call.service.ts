import { prisma } from "../../lib/prisma";

const initiateCall = async (payload: { callerId: string; receiverId: string; conversationId?: string; callType: "AUDIO" | "VIDEO"; }) => {
  const callLog = await prisma.callLog.create({
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

const acceptCall = async (callId: string, receiverId: string) => {
  const callLog = await prisma.callLog.update({
    where: { id: callId },
    data: { status: "COMPLETED" },
    include: {
      caller: { select: { id: true, name: true, image: true } },
      receiver: { select: { id: true, name: true, image: true } },
    },
  });
  return callLog;
};

const rejectCall = async (callId: string) => {
  const callLog = await prisma.callLog.update({
    where: { id: callId },
    data: { status: "REJECTED" },
  });
  return callLog;
};

const missedCall = async (callId: string) => {
  const callLog = await prisma.callLog.update({
    where: { id: callId },
    data: { status: "MISSED" },
  });
  return callLog;
};

const endCall = async (callId: string, duration: number, recordingUrl?: string) => {
  const callLog = await prisma.callLog.update({
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

const getCallHistory = async (userId: string, limit: number = 20) => {
  const calls = await prisma.callLog.findMany({
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

const getMissedCalls = async (userId: string) => {
  const missedCalls = await prisma.callLog.findMany({
    where: { receiverId: userId, status: "MISSED" },
    include: { caller: { select: { id: true, name: true, image: true } } },
    orderBy: { createdAt: "desc" },
  });
  return missedCalls;
};

export const callService = { initiateCall, acceptCall, rejectCall, missedCall, endCall, getCallHistory, getMissedCalls };
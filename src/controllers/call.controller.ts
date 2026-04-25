import { Request, Response } from "express";
import catchAsync from "../utils/catchAsync";
import { callService } from "../services/call.service";
import AppError from "../utils/AppError";

type AuthenticatedRequest = Request & { user?: { id: string } };

const initiateCall = catchAsync(async (req: Request, res: Response) => {
  const { receiverId, conversationId, callType } = req.body;
  const user = (req as AuthenticatedRequest).user;

  if (!receiverId) throw new AppError(400, "Receiver ID is required");
  if (!callType || !["AUDIO", "VIDEO"].includes(callType)) throw new AppError(400, "Call type must be AUDIO or VIDEO");
  if (receiverId === user!.id) throw new AppError(400, "Cannot call yourself");

  const callLog = await callService.initiateCall({ callerId: user!.id, receiverId, conversationId, callType });

  res.status(201).json({ success: true, message: "Call initiated", data: callLog });
});

const acceptCall = catchAsync(async (req: Request, res: Response) => {
  const { callId } = req.body;
  const user = (req as AuthenticatedRequest).user;

  if (!callId) throw new AppError(400, "Call ID is required");

  const callLog = await callService.acceptCall(callId, user!.id);
  res.status(200).json({ success: true, message: "Call accepted", data: callLog });
});

const rejectCall = catchAsync(async (req: Request, res: Response) => {
  const { callId } = req.body;
  if (!callId) throw new AppError(400, "Call ID is required");

  const callLog = await callService.rejectCall(callId);
  res.status(200).json({ success: true, message: "Call rejected", data: callLog });
});

const missedCall = catchAsync(async (req: Request, res: Response) => {
  const { callId } = req.body;
  if (!callId) throw new AppError(400, "Call ID is required");

  const callLog = await callService.missedCall(callId);
  res.status(200).json({ success: true, message: "Call marked as missed", data: callLog });
});

const endCall = catchAsync(async (req: Request, res: Response) => {
  const { callId, duration, recordingUrl } = req.body;
  if (!callId) throw new AppError(400, "Call ID is required");

  const callLog = await callService.endCall(callId, duration || 0, recordingUrl);
  res.status(200).json({ success: true, message: "Call ended", data: callLog });
});

const getCallHistory = catchAsync(async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

  const calls = await callService.getCallHistory(user!.id, limit);
  res.status(200).json({ success: true, message: "Call history fetched", data: calls });
});

const getMissedCalls = catchAsync(async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user;
  const missedCalls = await callService.getMissedCalls(user!.id);
  res.status(200).json({ success: true, message: "Missed calls fetched", data: missedCalls });
});

export const callController = { initiateCall, acceptCall, rejectCall, missedCall, endCall, getCallHistory, getMissedCalls };
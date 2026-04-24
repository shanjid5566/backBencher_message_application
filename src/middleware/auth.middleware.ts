import { NextFunction, Request, Response } from "express";
import { auth } from "../../lib/auth";
import { fromNodeHeaders } from "better-auth/node";
import catchAsync from "../utils/catchAsync";
import AppError from "../utils/AppError";

// Middleware to protect routes and ensure user is authenticated and verified
export const protect = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (!session) {
    throw new AppError(401, "Authentication required. Please login.");
  }

  if (!session.user.emailVerified) {
    throw new AppError(403, "Access denied. Please verify your email address.");
  }

  // Attach user and session to request for downstream use
  (req as any).user = session.user;
  (req as any).session = session.session;

  next();
});

// Middleware to authorize specific user roles (e.g., ADMIN)
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    if (!user || !roles.includes(user.role)) {
      throw new AppError(403, `Forbidden: You do not have permission (${user?.role})`);
    }

    next();
  };
};
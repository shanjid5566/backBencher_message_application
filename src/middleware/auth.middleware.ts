import { NextFunction, Request, Response } from "express";
import { auth } from "../../lib/auth";
import { fromNodeHeaders } from "better-auth/node";
import { prisma } from "../../lib/prisma";
import catchAsync from "../utils/catchAsync";
import AppError from "../utils/AppError";

// Middleware to protect routes and ensure user is authenticated and verified
export const protect = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  let user = null;
  let session = null;

  // Try 1: Get session from better-auth (for cookie-based auth)
  try {
    session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (session) {
      user = session.user;
    }
  } catch (error) {
    console.log("Session retrieval from cookies failed, trying Authorization header...");
  }

  // Try 2: Get user from Authorization header (for token-based auth)
  if (!user) {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const tokenParts = token.split("_");

      if (tokenParts.length >= 2) {
        const userId = tokenParts[0];
        
        try {
          user = await prisma.user.findUnique({
            where: { id: userId },
          });
        } catch (error) {
          console.error("Error fetching user from token:", error);
        }
      }
    }
  }

  // If still no user, authentication failed
  if (!user) {
    throw new AppError(401, "Authentication required. Please login.");
  }

  // Verify email is verified (only if we have a better-auth session)
  if (session && !session.user.emailVerified) {
    throw new AppError(403, "Access denied. Please verify your email address.");
  }

  // Attach user and session to request for downstream use
  (req as any).user = user;
  (req as any).session = session;
  (req as any).userId = user.id;

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
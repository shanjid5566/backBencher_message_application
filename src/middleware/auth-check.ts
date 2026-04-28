import { Request, Response, NextFunction } from "express";
import { prisma } from "../../lib/prisma";

/**
 * Authentication middleware to verify token from Authorization header
 * Expected format: Authorization: Bearer {token}
 */
export const authCheckMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Authorization header missing",
      });
    }

    // Extract token from "Bearer {token}" format
    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(401).json({
        success: false,
        message: "Invalid authorization header format",
      });
    }

    const token = parts[1];

    // Token format is: {userId}_{timestamp}
    // We use userId to get user from database
    const tokenParts = token.split("_");
    if (tokenParts.length < 2) {
      return res.status(401).json({
        success: false,
        message: "Invalid token format",
      });
    }

    const userId = tokenParts[0];

    // Verify user exists in database
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // Attach user to request object for use in route handlers
    (req as any).user = user;
    (req as any).userId = userId;
    (req as any).token = token;

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Authentication error",
    });
  }
};

/**
 * Optional: Middleware to check if user is authenticated
 * If token is valid, attach user to request
 * If not, just continue (for public routes that can also be authenticated)
 */
export const optionalAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader) {
      const parts = authHeader.split(" ");
      if (parts.length === 2 && parts[0] === "Bearer") {
        const token = parts[1];
        const tokenParts = token.split("_");
        
        if (tokenParts.length >= 2) {
          const userId = tokenParts[0];
          const user = await prisma.user.findUnique({
            where: { id: userId },
          });

          if (user) {
            (req as any).user = user;
            (req as any).userId = userId;
            (req as any).token = token;
          }
        }
      }
    }

    next();
  } catch (error) {
    console.error("Optional auth middleware error:", error);
    next();
  }
};

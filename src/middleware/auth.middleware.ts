import { Request, Response, NextFunction } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../../lib/auth';
import AppError from '../utils/AppError';

// Extend Express Request to carry the authenticated user + session
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name: string;
        email: string;
        emailVerified: boolean;
        image?: string | null;
        createdAt: Date;
        updatedAt: Date;
      };
      session?: {
        id: string;
        userId: string;
        expiresAt: Date;
        token: string;
      };
    }
  }
}

/**
 * protect – verifies the Better Auth session attached to the request.
 * Reads the session cookie (or Bearer token) automatically via Better Auth's
 * `api.getSession` helper, then attaches `req.user` and `req.session`.
 */
export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const sessionData = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!sessionData || !sessionData.user || !sessionData.session) {
      return next(new AppError(401, 'Unauthorized: Please log in to continue.'));
    }

    req.user = sessionData.user;
    req.session = sessionData.session;

    next();
  } catch (error) {
    next(new AppError(401, 'Unauthorized: Invalid or expired session.'));
  }
};

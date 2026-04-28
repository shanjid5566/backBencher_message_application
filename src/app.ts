import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import path from 'path';
import { messageRoutes } from "./routes/message.routes";

import { auth } from "../lib/auth";
import { toNodeHandler } from "better-auth/node";
import { config } from "./config";

// Import Rate Limiter
import rateLimit from "express-rate-limit";
import { conversationRoutes } from "./routes/conversation.routes";
import { userRoutes } from './routes/user.routes';
import { callRoutes } from './routes/call.routes';

// Create Express application instance
const app: Application = express();

// ---  Global Middlewares ---
// To receive cookies or sessions from the client (Next.js), set `credentials: true`.
app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Security Middleware (Rate Limiting) ---
// Stricter limit for authentication actions (login, signup, etc.)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 50, 
  skip: (req) => req.method === 'GET', // Skip rate limiting for GET requests (session checks)
  message: { 
    success: false, 
    message: 'Too many authentication attempts. Please try again after 15 minutes.' 
  }
});

// --- Better Auth Route ---
// Apply the rate limiter ONLY to auth routes
app.use('/api/auth/*path', authLimiter);

// Backward-compatible alias for frontend typo/legacy route name.
app.post('/api/auth/forget-password', (req: Request, res: Response) => {
  return res.redirect(307, '/api/auth/request-password-reset');
});

const normalizeVerifyCallbackURL = (callbackURL?: string) => {
  if (!callbackURL || callbackURL === '/' || callbackURL === '%2F') {
    return `${config.clientUrl}/login`;
  }

  if (callbackURL.startsWith('/')) {
    if (callbackURL === '/') {
      return `${config.clientUrl}/login`;
    }
    return `${config.clientUrl}${callbackURL}`;
  }

  try {
    const parsed = new URL(callbackURL);
    const client = new URL(config.clientUrl);

    // If callback points to frontend root, normalize to /login.
    if (
      parsed.origin === client.origin &&
      (parsed.pathname === '/' || parsed.pathname === '')
    ) {
      parsed.pathname = '/login';
      return parsed.toString();
    }
  } catch {
    // Keep original value if URL parsing fails.
  }

  return callbackURL;
};

app.get('/verify-email', (req: Request, res: Response) => {
  const query = req.query as { token?: string; callbackURL?: string };
  const token = query.token;

  if (!token) {
    return res.redirect(307, '/api/auth/verify-email');
  }

  const callbackURL = normalizeVerifyCallbackURL(query.callbackURL);
  const target = `/api/auth/verify-email?token=${encodeURIComponent(token)}&callbackURL=${encodeURIComponent(callbackURL)}`;
  return res.redirect(307, target);
});

app.get('/api/auth/verify-email', (req: Request, res: Response, next: NextFunction) => {
  const query = req.query as { token?: string; callbackURL?: string };
  const callbackURL = normalizeVerifyCallbackURL(query.callbackURL);

  if (callbackURL !== query.callbackURL) {
    const tokenPart = query.token ? `token=${encodeURIComponent(query.token)}&` : '';
    const target = `/api/auth/verify-email?${tokenPart}callbackURL=${encodeURIComponent(callbackURL)}`;
    return res.redirect(307, target);
  }

  next();
});

const buildResetPasswordRedirect = (token?: string, callbackURL?: string) => {
  const fallbackCallbackURL = `${config.clientUrl}/reset-password`;
  const targetCallbackURL = callbackURL || fallbackCallbackURL;

  if (!token) {
    return `${targetCallbackURL}`;
  }

  // Include token in callback URL as well for broader frontend compatibility.
  let callbackWithToken = targetCallbackURL;
  try {
    const url = new URL(targetCallbackURL);
    if (!url.searchParams.get('token')) {
      url.searchParams.set('token', token);
    }
    callbackWithToken = url.toString();
  } catch {
    callbackWithToken = `${fallbackCallbackURL}?token=${encodeURIComponent(token)}`;
  }

  return `/api/auth/reset-password/${encodeURIComponent(token)}?callbackURL=${encodeURIComponent(callbackWithToken)}`;
};

const parseResetTokenCookie = (cookieHeader?: string) => {
  if (!cookieHeader) return undefined;

  const match = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('bb_reset_token='));

  if (!match) return undefined;
  return decodeURIComponent(match.slice('bb_reset_token='.length));
};

app.get('/reset-password', (req: Request, res: Response) => {
  const query = req.query as { token?: string; callbackURL?: string };
  const token = query.token;
  const callbackURL = query.callbackURL;

  if (token) {
    res.cookie('bb_reset_token', encodeURIComponent(token), {
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
      path: '/',
    });
  }

  return res.redirect(307, buildResetPasswordRedirect(token, callbackURL));
});

app.get('/reset-password/:token', (req: Request, res: Response) => {
  const query = req.query as { callbackURL?: string };
  const callbackURL = query.callbackURL;
  const token = typeof req.params.token === 'string' ? req.params.token : undefined;

  if (token) {
    res.cookie('bb_reset_token', encodeURIComponent(token), {
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
      path: '/',
    });
  }

  return res.redirect(307, buildResetPasswordRedirect(token, callbackURL));
});

app.post('/api/auth/reset-password', (req: Request, res: Response, next: NextFunction) => {
  const query = req.query as { token?: string };
  const body = req.body as {
    token?: string;
    resetToken?: string;
    verificationToken?: string;
    code?: string;
    newPassword?: string;
    password?: string;
  };
  const cookieToken = parseResetTokenCookie(req.headers.cookie);

  if (!body.newPassword && body.password) {
    body.newPassword = body.password;
  }

  const finalToken =
    query.token ||
    cookieToken ||
    body.token ||
    body.resetToken ||
    body.verificationToken ||
    body.code;

  if (finalToken) {
    body.token = finalToken;
  }

  next();
});

// Helper endpoint to get token from cookies (after sign-in) - BEFORE app.all()
app.get("/api/auth/get-token", async (req: Request, res: Response) => {
  try {
    const cookieHeader = req.headers.cookie || '';
    
    // Extract the auth token from cookies
    // Better-auth sets various cookies, we need to find the session token
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = decodeURIComponent(value || '');
      return acc;
    }, {} as Record<string, string>);

    // Get session to verify authentication
    const headers = Object.entries(req.headers).reduce((acc, [key, value]) => {
      acc[key] = String(value);
      return acc;
    }, {} as Record<string, string>);

    const session = await auth.api.getSession({ headers });

    if (session && session.session) {
      return res.status(200).json({
        success: true,
        // Return the session token
        token: session.session.token || Object.values(cookies)[0],
        sessionId: session.session.id,
        user: session.user,
      });
    }

    return res.status(401).json({
      success: false,
      message: "Not authenticated",
    });
  } catch (error) {
    console.error("Token fetch error:", error);
    return res.status(401).json({
      success: false,
      message: "Failed to get token",
    });
  }
});

// Get current session endpoint - BEFORE app.all()
app.get("/api/auth/session", async (req: Request, res: Response) => {
  try {
    // Convert IncomingHttpHeaders to Record<string, string>
    const headers = Object.entries(req.headers).reduce((acc, [key, value]) => {
      acc[key] = String(value);
      return acc;
    }, {} as Record<string, string>);

    const session = await auth.api.getSession({ headers });
    
    if (session && session.session) {
      return res.status(200).json({
        success: true,
        session: session.session,
        user: session.user,
      });
    }
    
    return res.status(401).json({
      success: false,
      message: "Not authenticated",
    });
  } catch (error) {
    console.error("Session error:", error);
    return res.status(401).json({
      success: false,
      message: "Session check failed",
    });
  }
});

app.all("/api/auth/*path", toNodeHandler(auth));

// Middleware to handle Authorization header for cross-domain requests
app.use((req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    // Add token to cookies so better-auth can use it
    const token = authHeader.substring(7);
    req.headers.cookie = `${req.headers.cookie || ''}; auth_token=${token}`;
  }
  
  next();
});

// ---  Application Routes ---
app.use("/api/v1/messages", messageRoutes);
app.use("/api/v1/conversations", conversationRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/calls", callRoutes);

// 🔴 Serve static files from the uploads directory (Fixes the 404 error for images)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Root Route (Health Check)
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Backbencher Message API is running! 🚀",
  });
});

// --- 3. 404 Not Found Handler ---
app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({ success: false, message: "API Route not found" });
});

// --- 4. Global Error Handler ---
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    stack: config.env === "development" ? err.stack : undefined,
  });
});

export default app;
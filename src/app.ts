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
app.all("/api/auth/*path", toNodeHandler(auth));

// ---  Application Routes ---
app.use("/api/v1/messages", messageRoutes);
app.use("/api/v1/conversations", conversationRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/calls", callRoutes);
// app.use('/api/v1/auth', authRoutes); // Authentication routes (Better Auth) will be added here later
// Serve static files from the uploads directory
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

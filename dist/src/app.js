"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const message_routes_1 = require("./routes/message.routes");
const auth_1 = require("../lib/auth");
const node_1 = require("better-auth/node");
const config_1 = require("./config");
// Import Rate Limiter
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const conversation_routes_1 = require("./routes/conversation.routes");
const user_routes_1 = require("./routes/user.routes");
const call_routes_1 = require("./routes/call.routes");
// Create Express application instance
const app = (0, express_1.default)();
// ---  Global Middlewares ---
// To receive cookies or sessions from the client (Next.js), set `credentials: true`.
app.use((0, cors_1.default)({
    origin: config_1.config.clientUrl,
    credentials: true,
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// --- Security Middleware (Rate Limiting) ---
// Stricter limit for authentication actions (login, signup, etc.)
const authLimiter = (0, express_rate_limit_1.default)({
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
app.post('/api/auth/forget-password', (req, res) => {
    return res.redirect(307, '/api/auth/request-password-reset');
});
app.all("/api/auth/*path", (0, node_1.toNodeHandler)(auth_1.auth));
// ---  Application Routes ---
app.use("/api/v1/messages", message_routes_1.messageRoutes);
app.use("/api/v1/conversations", conversation_routes_1.conversationRoutes);
app.use("/api/v1/users", user_routes_1.userRoutes);
app.use("/api/v1/calls", call_routes_1.callRoutes);
// 🔴 Serve static files from the uploads directory (Fixes the 404 error for images)
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
// Root Route (Health Check)
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Backbencher Message API is running! 🚀",
    });
});
// --- 3. 404 Not Found Handler ---
app.use((req, res, next) => {
    res.status(404).json({ success: false, message: "API Route not found" });
});
// --- 4. Global Error Handler ---
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || "Internal Server Error",
        stack: config_1.config.env === "development" ? err.stack : undefined,
    });
});
exports.default = app;

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
const normalizeVerifyCallbackURL = (callbackURL) => {
    if (!callbackURL || callbackURL === '/' || callbackURL === '%2F') {
        return `${config_1.config.clientUrl}/login`;
    }
    if (callbackURL.startsWith('/')) {
        if (callbackURL === '/') {
            return `${config_1.config.clientUrl}/login`;
        }
        return `${config_1.config.clientUrl}${callbackURL}`;
    }
    try {
        const parsed = new URL(callbackURL);
        const client = new URL(config_1.config.clientUrl);
        // If callback points to frontend root, normalize to /login.
        if (parsed.origin === client.origin &&
            (parsed.pathname === '/' || parsed.pathname === '')) {
            parsed.pathname = '/login';
            return parsed.toString();
        }
    }
    catch {
        // Keep original value if URL parsing fails.
    }
    return callbackURL;
};
app.get('/verify-email', (req, res) => {
    const query = req.query;
    const token = query.token;
    if (!token) {
        return res.redirect(307, '/api/auth/verify-email');
    }
    const callbackURL = normalizeVerifyCallbackURL(query.callbackURL);
    const target = `/api/auth/verify-email?token=${encodeURIComponent(token)}&callbackURL=${encodeURIComponent(callbackURL)}`;
    return res.redirect(307, target);
});
app.get('/api/auth/verify-email', (req, res, next) => {
    const query = req.query;
    const callbackURL = normalizeVerifyCallbackURL(query.callbackURL);
    if (callbackURL !== query.callbackURL) {
        const tokenPart = query.token ? `token=${encodeURIComponent(query.token)}&` : '';
        const target = `/api/auth/verify-email?${tokenPart}callbackURL=${encodeURIComponent(callbackURL)}`;
        return res.redirect(307, target);
    }
    next();
});
const buildResetPasswordRedirect = (token, callbackURL) => {
    const fallbackCallbackURL = `${config_1.config.clientUrl}/reset-password`;
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
    }
    catch {
        callbackWithToken = `${fallbackCallbackURL}?token=${encodeURIComponent(token)}`;
    }
    return `/api/auth/reset-password/${encodeURIComponent(token)}?callbackURL=${encodeURIComponent(callbackWithToken)}`;
};
const parseResetTokenCookie = (cookieHeader) => {
    if (!cookieHeader)
        return undefined;
    const match = cookieHeader
        .split(';')
        .map((part) => part.trim())
        .find((part) => part.startsWith('bb_reset_token='));
    if (!match)
        return undefined;
    return decodeURIComponent(match.slice('bb_reset_token='.length));
};
app.get('/reset-password', (req, res) => {
    const query = req.query;
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
app.get('/reset-password/:token', (req, res) => {
    const query = req.query;
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
app.post('/api/auth/reset-password', (req, res, next) => {
    const query = req.query;
    const body = req.body;
    const cookieToken = parseResetTokenCookie(req.headers.cookie);
    if (!body.newPassword && body.password) {
        body.newPassword = body.password;
    }
    const finalToken = query.token ||
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

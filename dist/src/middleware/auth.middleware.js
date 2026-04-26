"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.protect = void 0;
const auth_1 = require("../../lib/auth");
const node_1 = require("better-auth/node");
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const AppError_1 = __importDefault(require("../utils/AppError"));
// Middleware to protect routes and ensure user is authenticated and verified
exports.protect = (0, catchAsync_1.default)(async (req, res, next) => {
    const session = await auth_1.auth.api.getSession({
        headers: (0, node_1.fromNodeHeaders)(req.headers),
    });
    if (!session) {
        throw new AppError_1.default(401, "Authentication required. Please login.");
    }
    if (!session.user.emailVerified) {
        throw new AppError_1.default(403, "Access denied. Please verify your email address.");
    }
    // Attach user and session to request for downstream use
    req.user = session.user;
    req.session = session.session;
    next();
});
// Middleware to authorize specific user roles (e.g., ADMIN)
const authorize = (...roles) => {
    return (req, res, next) => {
        const user = req.user;
        if (!user || !roles.includes(user.role)) {
            throw new AppError_1.default(403, `Forbidden: You do not have permission (${user?.role})`);
        }
        next();
    };
};
exports.authorize = authorize;

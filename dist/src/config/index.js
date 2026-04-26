"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load .env file securely
dotenv_1.default.config({ path: path_1.default.join(process.cwd(), '.env') });
exports.config = {
    env: process.env.NODE_ENV || 'development',
    port: Number(process.env.PORT) || 5000,
    databaseUrl: process.env.DATABASE_URL,
    clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
    auth: {
        secret: process.env.BETTER_AUTH_SECRET,
        url: process.env.BETTER_AUTH_URL || 'http://localhost:5000',
    },
    smtp: {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
        fromEmail: process.env.EMAIL_FROM,
    },
    cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        apiSecret: process.env.CLOUDINARY_API_SECRET,
    }
};

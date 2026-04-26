"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const app_1 = __importDefault(require("./app"));
const prisma_1 = require("../lib/prisma");
const config_1 = require("./config");
const socket_1 = require("../lib/socket");
const PORT = config_1.config.port;
// HTTP Server
const server = (0, http_1.createServer)(app_1.default);
// Initialize Socket.IO here BEFORE starting the server
(0, socket_1.initSocket)(server);
async function main() {
    try {
        // Database Connection Check
        await prisma_1.prisma.$connect();
        console.log('🗄️  PostgreSQL Database connected successfully!');
        // Start the server
        server.listen(PORT, () => {
            console.log(`🚀 Server is running on http://localhost:${PORT}`);
        });
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        await prisma_1.prisma.$disconnect();
        process.exit(1);
    }
}
main();

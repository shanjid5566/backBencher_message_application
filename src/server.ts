import { createServer } from 'http';
import app from './app';
import { prisma } from '../lib/prisma';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;

// HTTP Server to create a server instance for potential future use with WebSockets (e.g., Socket.IO)
const server = createServer(app);

async function main() {
  try {
    // Database Connection Check
    await prisma.$connect();
    console.log('🗄️  PostgreSQL Database connected successfully!');

    // Start the server
    server.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
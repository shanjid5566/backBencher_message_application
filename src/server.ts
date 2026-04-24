import { createServer } from 'http';
import app from './app';
import { prisma } from '../lib/prisma';
import { config } from './config';
import { initSocket } from '../lib/socket';

const PORT = config.port;

// HTTP Server
const server = createServer(app);

// Initialize Socket.IO here BEFORE starting the server
initSocket(server);

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
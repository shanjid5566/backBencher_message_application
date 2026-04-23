import { createServer } from 'http';
import app from './app';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

// HTTP Server তৈরি করা হলো (ভবিষ্যতে Socket.io এখানে কানেক্ট হবে)
const server = createServer(app);

async function main() {
  try {
    // ডাটাবেজ কানেকশন চেক
    await prisma.$connect();
    console.log('🗄️  PostgreSQL Database connected successfully!');

    // সার্ভার স্টার্ট
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
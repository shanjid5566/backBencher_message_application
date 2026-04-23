import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { messageRoutes } from './routes/message.routes';

const app: Application = express();

// --- 1. গ্লোবাল মিডলওয়্যার ---
// ক্লায়েন্ট (Next.js) থেকে কুকি বা সেশন গ্রহণ করার জন্য `credentials: true` সেট করুন।
app.use(cors({ 
  origin: process.env.CLIENT_URL || 'http://localhost:3000', 
  credentials: true 
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- 2. অ্যাপ্লিকেশন রাউটসমূহ ---
app.use('/api/v1/messages', messageRoutes);
// app.use('/api/v1/auth', authRoutes); // অথেন্টিকেশন রাউট (Better Auth) পরে এখানে যোগ করা হবে

// মূল রুট (স্বাস্থ্য পরীক্ষা)
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({ 
    success: true, 
    message: 'Backbencher Message API is running! 🚀' 
  });
});

// --- 3. ৪০৪ Not Found হ্যান্ডলার ---
app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({ success: false, message: 'API Route not found' });
});

// --- 4. গ্লোবাল ত্রুটি হ্যান্ডলার ---
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

export default app;
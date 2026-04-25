import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { userController } from '../controllers/user.controller';
import { upload } from '../middleware/upload.middleware'; // 👈 ছবি আপলোডের জন্য ইমপোর্ট করা হলো

const router = Router();

router.get('/search', protect, userController.searchUsers);

// 🆕 Update user profile (with image upload capability)
router.put('/profile', protect, upload.single('image'), userController.updateProfile);

export const userRoutes = router;
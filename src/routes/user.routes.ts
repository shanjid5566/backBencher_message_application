import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { userController } from '../controllers/user.controller';
import { upload } from '../middleware/upload.middleware';

const router = Router();

router.get('/search', protect, userController.searchUsers);
router.put('/profile', protect, upload.single('image'), userController.updateProfile);

// 🆕 Change Password Route
router.put('/change-password', protect, userController.changePassword);

export const userRoutes = router;
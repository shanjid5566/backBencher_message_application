import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { userController } from '../controllers/user.controller';
import { upload } from '../middleware/upload.middleware';

const router = Router();

router.get('/search', protect, userController.searchUsers);
router.put('/profile', protect, upload.single('image'), userController.updateProfile);
router.put('/change-password', protect, userController.changePassword);

// 🔴 🆕 Block/Unblock Routes
router.post('/block', protect, userController.blockUser);
router.post('/unblock', protect, userController.unblockUser);
router.get('/block-status/:targetUserId', protect, userController.checkBlockStatus);

export const userRoutes = router;
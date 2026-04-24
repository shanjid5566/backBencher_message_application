import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { userController } from '../controllers/user.controller';

const router = Router();

router.get('/search', protect, userController.searchUsers);

export const userRoutes = router;
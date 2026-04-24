import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validateRequest'; 
import { conversationController } from '../controllers/conversation.controller';
import { createConversationSchema } from '../schemas/conversation.schema';

const router = Router();

// Route to get all conversations of the logged-in user (Inbox)
router.get(
  '/', 
  protect, 
  conversationController.getConversations
);

// Route to create a new 1-to-1 conversation or get an existing one
router.post(
  '/', 
  protect, 
  validateRequest(createConversationSchema, 'body'), 
  conversationController.createConversation
);

export const conversationRoutes = router;
import { Router } from 'express';
import {
  getNotifications,
  markAllAsRead,
  markOneAsRead,
} from '../controllers/notification.controller';
import { authenticateUser } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateUser);

router.get('/', getNotifications);
router.patch('/mark-read', markAllAsRead);
router.patch('/:id/read', markOneAsRead);

export default router;

import { Router } from 'express';
import {
  register,
  login,
  logout,
  refreshToken,
  getProfile,
  getProfileById,
  updateProfile,
} from '../controllers/auth.controller';
import { authenticateUser } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import { registerSchema, loginSchema } from '../validators/auth.validator';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/logout', logout);
router.post('/refresh-token', refreshToken);

// Protected routes
router.get('/profile', authenticateUser, getProfile);
router.get('/profile/:id', getProfileById);
router.patch('/profile', authenticateUser, updateProfile);

export default router;

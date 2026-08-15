import { Router } from 'express';
import {
  register,
  login,
  logout,
  refreshToken,
  getProfile,
  getProfileById,
  updateProfile,
  verifyOTP,
  resendOTP,
  loginSendOTP,
  loginVerifyOTP,
} from '../controllers/auth.controller';
import { authenticateUser } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import { registerSchema, loginSchema } from '../validators/auth.validator';
import { upload } from '../middleware/upload.middleware';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/logout', logout);
router.post('/refresh-token', refreshToken);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/login-send-otp', loginSendOTP);
router.post('/login-verify-otp', loginVerifyOTP);

// Protected routes
router.get('/profile', authenticateUser, getProfile);
router.get('/profile/:id', getProfileById);
router.patch('/profile', authenticateUser, upload.single('avatar'), updateProfile);

export default router;

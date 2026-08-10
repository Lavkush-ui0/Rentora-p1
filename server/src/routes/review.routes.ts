import { Router } from 'express';
import { createReview, getUserReviews } from '../controllers/review.controller';
import { authenticateUser } from '../middleware/auth.middleware';

const router = Router();

// Publicly read reviews for a specific user
router.get('/user/:userId', getUserReviews);

// Write reviews requires login
router.post('/', authenticateUser, createReview);

export default router;

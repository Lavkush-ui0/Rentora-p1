import { Router } from 'express';
import { createReport } from '../controllers/admin.controller';
import { authenticateUser } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authenticateUser, createReport);

export default router;

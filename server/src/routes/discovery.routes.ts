import { Router } from 'express';
import { getHomepageData } from '../controllers/discovery.controller';

const router = Router();

// Publicly available homepage/discovery endpoints
router.get('/', getHomepageData);
router.get('/home', getHomepageData);

export default router;

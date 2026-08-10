import { Router } from 'express';
import { Category } from '../models/category.model';

const router = Router();

/**
 * GET /categories
 * Public endpoint — returns all active categories.
 * Used by Explore and ListItem pages for any logged-in or anonymous user.
 */
router.get('/', async (req, res, next) => {
  try {
    const categories = await Category.find({}).sort({ name: 1 });
    return res.json({
      success: true,
      categories,
    });
  } catch (error) {
    return next(error);
  }
});

export default router;

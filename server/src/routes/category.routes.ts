import { Router } from 'express';
import { Category } from '../models/category.model';

const router = Router();

/**
 * GET /categories
 * Public endpoint — returns all active categories.
 * Used by Explore and ListItem pages for any logged-in or anonymous user.
 */
let cachedCategories: any = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

router.get('/', async (req, res, next) => {
  try {
    if (cachedCategories && Date.now() - lastCacheTime < CACHE_TTL_MS) {
      return res.json({
        success: true,
        categories: cachedCategories,
        cached: true,
      });
    }

    const categories = await Category.find({}).sort({ name: 1 }).lean();
    cachedCategories = categories;
    lastCacheTime = Date.now();

    return res.json({
      success: true,
      categories,
    });
  } catch (error) {
    return next(error);
  }
});

export const clearCategoryCache = () => {
  cachedCategories = null;
  lastCacheTime = 0;
};

export default router;

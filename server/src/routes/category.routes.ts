import { Router } from 'express';
import { supabase } from '../config/supabase';

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

    const { data: dbCategories, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error || !dbCategories) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch categories',
      });
    }

    // Format properties to align with Mongoose schema expected by client
    const categories = dbCategories.map((c: any) => ({
      _id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      icon: c.icon,
      isActive: c.is_active,
      createdAt: c.created_at,
    }));

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


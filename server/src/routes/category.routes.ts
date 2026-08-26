import { Router } from 'express';
import { supabase } from '../config/supabase';

const router = Router();

/**
 * GET /categories
 * Public endpoint — returns all active categories.
 */
router.get('/', async (req, res, next) => {
  try {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error || !categories) {
      return res.status(500).json({ success: false, message: 'Failed to fetch categories' });
    }

    const formatted = categories.map((c: any) => ({
      _id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      icon: c.icon,
      isActive: c.is_active,
    }));

    return res.json({
      success: true,
      categories: formatted,
    });
  } catch (error) {
    return next(error);
  }
});

export default router;

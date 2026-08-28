import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import CustomError from '../utils/customError';

// In-memory cache for instant responses (60s TTL)
interface CacheEntry {
  data: any;
  timestamp: number;
}
const homepageCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 1000;

export const clearHomepageCache = () => {
  homepageCache.clear();
};

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?q=80&w=600&auto=format&fit=crop';

const sanitizeImage = (img: string | undefined): string => {
  if (!img) return FALLBACK_IMG;
  if (img.startsWith('data:image') || img.length > 500) {
    return FALLBACK_IMG;
  }
  return img;
};

const mapListings = (list: any[]) => (list || []).map((l: any) => ({
  _id: l.id,
  owner: l.owner ? {
    _id: l.owner.id,
    fullName: l.owner.full_name,
    avatar: l.owner.avatar,
    ratingAverage: Number(l.owner.rating_average)
  } : null,
  title: l.title,
  slug: l.slug,
  description: l.description,
  images: l.images && l.images.length > 0 ? [sanitizeImage(l.images[0])] : [FALLBACK_IMG],
  condition: l.condition,
  rentalPrice: Number(l.rental_price),
  priceUnit: l.price_unit,
  securityDeposit: Number(l.security_deposit),
  availability: l.availability,
  status: l.status,
  approvalStatus: l.approval_status,
  location: l.location,
  createdAt: l.created_at
}));

export const getHomepageData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = 6;
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const { location } = req.query as any;
    const cacheKey = `home_${location || 'All'}`;

    // Return cached payload if valid
    const cached = homepageCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return res.json({
        success: true,
        data: cached.data,
        cached: true,
      });
    }

    // 1. Cheapest Products Query
    let queryCheapest = supabase
      .from('listings')
      .select('*, owner:owner_id(id, full_name, avatar, rating_average)')
      .eq('status', 'ACTIVE')
      .eq('availability', true)
      .eq('approval_status', 'APPROVED')
      .order('rental_price', { ascending: true })
      .limit(limit);

    if (location && location !== 'All') {
      queryCheapest = queryCheapest.eq('location', location);
    }

    // 2. Top Demanded Products Query
    let queryDemanded = supabase
      .from('listings')
      .select('*, owner:owner_id(id, full_name, avatar, rating_average)')
      .eq('status', 'ACTIVE')
      .eq('availability', true)
      .eq('approval_status', 'APPROVED')
      .order('request_count', { ascending: false })
      .order('view_count', { ascending: false })
      .limit(limit);

    if (location && location !== 'All') {
      queryDemanded = queryDemanded.eq('location', location);
    }

    // 3. Top Rated Listings Query
    let queryRated = supabase
      .from('listings')
      .select('*, owner:owner_id(id, full_name, avatar, rating_average)')
      .eq('status', 'ACTIVE')
      .eq('availability', true)
      .eq('approval_status', 'APPROVED')
      .order('rating_average', { ascending: false })
      .order('request_count', { ascending: false })
      .order('view_count', { ascending: false })
      .limit(4);

    if (location && location !== 'All') {
      queryRated = queryRated.eq('location', location);
    }

    const [cheapestRes, demandedRes, ratedRes] = await Promise.all([
      queryCheapest,
      queryDemanded,
      queryRated
    ]);

    const cheapestProducts = mapListings(cheapestRes.data || []);
    const topDemanded = mapListings(demandedRes.data || []);
    const topRatedListings = mapListings(ratedRes.data || []);

    // 4. Trending Products Query (Weekly Aggregation in Javascript)
    const { data: recentRequests } = await supabase
      .from('rental_requests')
      .select('listing_id')
      .gte('created_at', oneWeekAgo.toISOString());

    const counts = (recentRequests || []).reduce((acc: any, curr: any) => {
      acc[curr.listing_id] = (acc[curr.listing_id] || 0) + 1;
      return acc;
    }, {});
    const sortedListingIds = Object.keys(counts)
      .sort((a, b) => counts[b] - counts[a])
      .slice(0, limit);

    let trendingProducts: any[] = [];
    if (sortedListingIds.length > 0) {
      let trendQuery = supabase
        .from('listings')
        .select('*, owner:owner_id(id, full_name, avatar, rating_average)')
        .in('id', sortedListingIds)
        .eq('status', 'ACTIVE')
        .eq('availability', true)
        .eq('approval_status', 'APPROVED');

      if (location && location !== 'All') {
        trendQuery = trendQuery.eq('location', location);
      }
      const { data: trendData } = await trendQuery;
      trendingProducts = mapListings(trendData || []);
    }

    // Fallback for trending if low activity
    if (trendingProducts.length < 3) {
      const existingIds = trendingProducts.map(p => p._id);
      let queryFallbackTrend = supabase
        .from('listings')
        .select('*, owner:owner_id(id, full_name, avatar, rating_average)')
        .eq('status', 'ACTIVE')
        .eq('availability', true)
        .eq('approval_status', 'APPROVED');

      if (existingIds.length > 0) {
        queryFallbackTrend = queryFallbackTrend.not('id', 'in', `(${existingIds.join(',')})`);
      }
      if (location && location !== 'All') {
        queryFallbackTrend = queryFallbackTrend.eq('location', location);
      }
      queryFallbackTrend = queryFallbackTrend
        .order('view_count', { ascending: false })
        .limit(limit - trendingProducts.length);

      const { data: fallbackTrendData } = await queryFallbackTrend;
      trendingProducts = [...trendingProducts, ...mapListings(fallbackTrendData || [])];
    }

    // 5. Weekly Top Students Query (Weekly Aggregation in Javascript)
    const { data: recentReviews } = await supabase
      .from('reviews')
      .select('reviewee_id, rating')
      .gte('created_at', oneWeekAgo.toISOString());

    const studentStats = (recentReviews || []).reduce((acc: any, curr: any) => {
      if (!acc[curr.reviewee_id]) {
        acc[curr.reviewee_id] = { sum: 0, count: 0 };
      }
      acc[curr.reviewee_id].sum += Number(curr.rating);
      acc[curr.reviewee_id].count += 1;
      return acc;
    }, {});

    const sortedStudentIds = Object.keys(studentStats)
      .sort((a, b) => {
        const avgA = studentStats[a].sum / studentStats[a].count;
        const avgB = studentStats[b].sum / studentStats[b].count;
        if (avgA !== avgB) return avgB - avgA;
        return studentStats[b].count - studentStats[a].count;
      })
      .slice(0, limit);

    let topStudents: any[] = [];
    if (sortedStudentIds.length > 0) {
      const { data: studentsData } = await supabase
        .from('users')
        .select('id, full_name, avatar, rating_average, completed_rentals, bio, course, branch, year, college_name')
        .in('id', sortedStudentIds)
        .eq('is_blocked', false);

      topStudents = (studentsData || []).map((s: any) => ({
        _id: s.id,
        fullName: s.full_name,
        avatar: s.avatar,
        ratingAverage: Number(s.rating_average),
        completedRentals: s.completed_rentals,
        bio: s.bio,
        course: s.course,
        branch: s.branch,
        year: s.year,
        collegeName: s.college_name,
      }));
    }

    // Fallback: highly rated users with completed rentals
    if (topStudents.length < 3) {
      const existingStudentIds = topStudents.map(s => s._id);
      let queryFallbackStudents = supabase
        .from('users')
        .select('id, full_name, avatar, rating_average, completed_rentals, bio, course, branch, year, college_name')
        .eq('is_blocked', false)
        .gt('completed_rentals', 0);

      if (existingStudentIds.length > 0) {
        queryFallbackStudents = queryFallbackStudents.not('id', 'in', `(${existingStudentIds.join(',')})`);
      }
      if (location && location !== 'All') {
        queryFallbackStudents = queryFallbackStudents.eq('college_name', location);
      }
      queryFallbackStudents = queryFallbackStudents
        .order('rating_average', { ascending: false })
        .order('completed_rentals', { ascending: false })
        .limit(limit - topStudents.length);

      const { data: fallbackStudents } = await queryFallbackStudents;
      const formattedFallbacks = (fallbackStudents || []).map((s: any) => ({
        _id: s.id,
        fullName: s.full_name,
        avatar: s.avatar,
        ratingAverage: Number(s.rating_average),
        completedRentals: s.completed_rentals,
        bio: s.bio,
        course: s.course,
        branch: s.branch,
        year: s.year,
        collegeName: s.college_name,
      }));
      topStudents = [...topStudents, ...formattedFallbacks];

      // Global fallback if still less than 3
      if (topStudents.length < 3) {
        const nextIds = topStudents.map(s => s._id);
        let queryGlobalFallback = supabase
          .from('users')
          .select('id, full_name, avatar, rating_average, completed_rentals, bio, course, branch, year, college_name')
          .eq('is_blocked', false)
          .gt('completed_rentals', 0);

        if (nextIds.length > 0) {
          queryGlobalFallback = queryGlobalFallback.not('id', 'in', `(${nextIds.join(',')})`);
        }
        queryGlobalFallback = queryGlobalFallback
          .order('rating_average', { ascending: false })
          .order('completed_rentals', { ascending: false })
          .limit(limit - topStudents.length);

        const { data: globalFallbacks } = await queryGlobalFallback;
        const formattedGlobals = (globalFallbacks || []).map((s: any) => ({
          _id: s.id,
          fullName: s.full_name,
          avatar: s.avatar,
          ratingAverage: Number(s.rating_average),
          completedRentals: s.completed_rentals,
          bio: s.bio,
          course: s.course,
          branch: s.branch,
          year: s.year,
          collegeName: s.college_name,
        }));
        topStudents = [...topStudents, ...formattedGlobals];
      }
    }

    // Process Top Rated Listings Day Shift
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (24 * 60 * 60 * 1000));
    let topRatedProducts = [...topRatedListings];
    if (topRatedProducts.length > 8) {
      const startIndex = dayOfYear % (topRatedProducts.length - 7);
      topRatedProducts = topRatedProducts.slice(startIndex, startIndex + 8);
    }

    const payload = {
      cheapestProducts,
      topDemanded,
      trendingProducts,
      topStudents,
      topRatedProducts,
    };

    // Save to cache
    homepageCache.set(cacheKey, {
      data: payload,
      timestamp: Date.now(),
    });

    return res.json({
      success: true,
      data: payload,
    });
  } catch (error) {
    return next(error);
  }
};

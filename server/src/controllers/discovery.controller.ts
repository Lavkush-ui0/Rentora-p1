import { Request, Response, NextFunction } from 'express';
import { Listing } from '../models/listing.model';
import { RentalRequest } from '../models/rentalRequest.model';
import { Review } from '../models/review.model';
import { User } from '../models/user.model';

// In-memory cache for instant responses (60s TTL)
interface CacheEntry {
  data: any;
  timestamp: number;
}
const homepageCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 1000;

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

    // Base filter for listings
    const listingFilter: any = { status: 'ACTIVE', availability: true };
    if (location && location !== 'All') {
      listingFilter.location = location;
    }

    // User filter for college
    let userFilter: any = { isBlocked: false };
    if (location && location !== 'All') {
      userFilter.collegeName = location;
    }

    // Run parallel queries
    const [
      cheapestProducts,
      topDemanded,
      trendingListingsAgg,
      weeklyTopStudentsAgg,
      topRatedListings,
      matchingUsers
    ] = await Promise.all([
      // 1. Cheapest Products
      Listing.find(listingFilter)
        .sort({ rentalPrice: 1 })
        .limit(limit)
        .populate('owner', 'fullName avatar ratingAverage')
        .lean(),

      // 2. Top Demanded Products
      Listing.find(listingFilter)
        .sort({ requestCount: -1, viewCount: -1 })
        .limit(limit)
        .populate('owner', 'fullName avatar ratingAverage')
        .lean(),

      // 3. Trending IDs aggregate
      RentalRequest.aggregate([
        { $match: { createdAt: { $gte: oneWeekAgo } } },
        { $group: { _id: '$listing', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: limit },
      ]),

      // 4. Weekly Top Students aggregate
      Review.aggregate([
        { $match: { createdAt: { $gte: oneWeekAgo } } },
        {
          $group: {
            _id: '$reviewee',
            avgWeeklyRating: { $avg: '$rating' },
            weeklyReviewCount: { $sum: 1 },
          },
        },
        { $sort: { avgWeeklyRating: -1, weeklyReviewCount: -1 } },
        { $limit: limit },
      ]),

      // 5. Top Rated Products
      Listing.find(listingFilter)
        .sort({ rating: -1, requestCount: -1, viewCount: -1 })
        .limit(20)
        .populate('owner', 'fullName avatar ratingAverage')
        .lean(),

      // User IDs
      User.find(userFilter).select('_id').lean(),
    ]);

    // Process Trending products
    let trendingProducts: any[] = [];
    if (trendingListingsAgg.length > 0) {
      const listingIds = trendingListingsAgg.map(item => item._id);
      const trendingFilter: any = {
        _id: { $in: listingIds },
        status: 'ACTIVE',
        availability: true,
      };
      if (location && location !== 'All') {
        trendingFilter.location = location;
      }
      trendingProducts = await Listing.find(trendingFilter)
        .populate('owner', 'fullName avatar ratingAverage')
        .lean();
    }

    // Fallback for trending products if weekly activity is low
    if (trendingProducts.length < 3) {
      const extraFilter: any = {
        status: 'ACTIVE',
        availability: true,
        _id: { $nin: trendingProducts.map(p => p._id) },
      };
      if (location && location !== 'All') {
        extraFilter.location = location;
      }
      const extraListings = await Listing.find(extraFilter)
        .sort({ viewCount: -1 })
        .limit(limit - trendingProducts.length)
        .populate('owner', 'fullName avatar ratingAverage')
        .lean();
      trendingProducts = [...trendingProducts, ...extraListings];
    }

    // Process Top Students
    let topStudents: any[] = [];
    if (weeklyTopStudentsAgg.length > 0) {
      const studentIds = weeklyTopStudentsAgg.map(item => item._id);
      topStudents = await User.find({
        _id: { $in: studentIds },
        isBlocked: false,
      })
        .select('fullName avatar ratingAverage completedRentals bio course branch year collegeName')
        .lean();
    }

    // Fallback: highly rated users with completed rentals
    if (topStudents.length < 3) {
      const fallbackUserFilter: any = {
        isBlocked: false,
        completedRentals: { $gt: 0 },
        _id: { $nin: topStudents.map(s => s._id) },
      };
      if (location && location !== 'All') {
        fallbackUserFilter.collegeName = location;
      }
      const extraStudents = await User.find(fallbackUserFilter)
        .sort({ ratingAverage: -1, completedRentals: -1 })
        .limit(limit - topStudents.length)
        .select('fullName avatar ratingAverage completedRentals bio course branch year collegeName')
        .lean();
      topStudents = [...topStudents, ...extraStudents];

      if (topStudents.length < 3) {
        const globalFallbackFilter: any = {
          isBlocked: false,
          completedRentals: { $gt: 0 },
          _id: { $nin: topStudents.map(s => s._id) },
        };
        const globalExtraStudents = await User.find(globalFallbackFilter)
          .sort({ ratingAverage: -1, completedRentals: -1 })
          .limit(limit - topStudents.length)
          .select('fullName avatar ratingAverage completedRentals bio course branch year collegeName')
          .lean();
        topStudents = [...topStudents, ...globalExtraStudents];
      }
    }

    // Process Top Rated Listings
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

    // Save to in-memory cache
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


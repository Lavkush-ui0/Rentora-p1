import { Request, Response, NextFunction } from 'express';
import { Listing } from '../models/listing.model';
import { RentalRequest } from '../models/rentalRequest.model';
import { Review } from '../models/review.model';
import { User } from '../models/user.model';

export const getHomepageData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = 6;
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 1. Cheapest Products (Sort active listings by price ascending)
    const cheapestProducts = await Listing.find({ status: 'ACTIVE', availability: true })
      .sort({ rentalPrice: 1 })
      .limit(limit)
      .populate('owner', 'fullName avatar ratingAverage');

    // 2. Top Demanded Products (Sort by total requestCount)
    const topDemanded = await Listing.find({ status: 'ACTIVE', availability: true })
      .sort({ requestCount: -1, viewCount: -1 })
      .limit(limit)
      .populate('owner', 'fullName avatar ratingAverage');

    // 3. Trending This Week (listings with most requests created in the last 7 days)
    const trendingListingsAgg = await RentalRequest.aggregate([
      { $match: { createdAt: { $gte: oneWeekAgo } } },
      { $group: { _id: '$listing', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit },
    ]);

    let trendingProducts: any[] = [];
    if (trendingListingsAgg.length > 0) {
      const listingIds = trendingListingsAgg.map(item => item._id);
      trendingProducts = await Listing.find({
        _id: { $in: listingIds },
        status: 'ACTIVE',
        availability: true,
      }).populate('owner', 'fullName avatar ratingAverage');
    }

    // Fallback for trending products if weekly activity is low
    if (trendingProducts.length < 3) {
      const extraListings = await Listing.find({
        status: 'ACTIVE',
        availability: true,
        _id: { $nin: trendingProducts.map(p => p._id) },
      })
        .sort({ viewCount: -1 })
        .limit(limit - trendingProducts.length)
        .populate('owner', 'fullName avatar ratingAverage');
      trendingProducts = [...trendingProducts, ...extraListings];
    }

    // 4. Top Rated Students This Week (ratings received during current week)
    const weeklyTopStudentsAgg = await Review.aggregate([
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
    ]);

    let topStudents: any[] = [];
    if (weeklyTopStudentsAgg.length > 0) {
      const studentIds = weeklyTopStudentsAgg.map(item => item._id);
      topStudents = await User.find({
        _id: { $in: studentIds },
        isBlocked: false,
      }).select('fullName avatar ratingAverage completedRentals bio course branch year');
    }

    // Fallback: highly rated users with completed rentals
    if (topStudents.length < 3) {
      const extraStudents = await User.find({
        isBlocked: false,
        completedRentals: { $gt: 0 },
        _id: { $nin: topStudents.map(s => s._id) },
      })
        .sort({ ratingAverage: -1, completedRentals: -1 })
        .limit(limit - topStudents.length)
        .select('fullName avatar ratingAverage completedRentals bio course branch year');
      topStudents = [...topStudents, ...extraStudents];
    }

    // 5. Top Rated Products (Daily Refresh from Top 20 rated items)
    const topRatedListings = await Listing.find({ status: 'ACTIVE', availability: true })
      .sort({ rating: -1, requestCount: -1, viewCount: -1 })
      .limit(20)
      .populate('owner', 'fullName avatar ratingAverage');

    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (24 * 60 * 60 * 1000));
    let topRatedProducts = [...topRatedListings];
    if (topRatedProducts.length > 8) {
      const startIndex = dayOfYear % (topRatedProducts.length - 7);
      topRatedProducts = topRatedProducts.slice(startIndex, startIndex + 8);
    }

    return res.json({
      success: true,
      data: {
        cheapestProducts,
        topDemanded,
        trendingProducts,
        topStudents,
        topRatedProducts,
      },
    });
  } catch (error) {
    return next(error);
  }
};

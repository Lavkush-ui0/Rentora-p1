import { Response, NextFunction } from 'express';
import { Review } from '../models/review.model';
import { RentalRequest } from '../models/rentalRequest.model';
import { User } from '../models/user.model';
import { Listing } from '../models/listing.model';
import { CustomRequest } from '../types';
import { createNotification } from '../services/notification.service';
import CustomError from '../utils/customError';

export const createReview = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new CustomError('Authentication required', 401, 'UNAUTHORIZED');
    }

    const { rentalRequestId, rating, comment } = req.body;

    const parsedRating = parseInt(rating);
    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      throw new CustomError('Rating must be an integer between 1 and 5', 400, 'INVALID_RATING');
    }

    // Verify completed rental request
    const request = await RentalRequest.findById(rentalRequestId);
    if (!request) {
      throw new CustomError('Rental request not found', 404, 'NOT_FOUND');
    }

    if (request.status !== 'COMPLETED') {
      throw new CustomError('Reviews can only be written for completed rentals', 400, 'RENTAL_NOT_COMPLETED');
    }

    // Verify that the user is either the owner or the renter
    const isOwner = request.owner.toString() === req.user._id.toString();
    const isRenter = request.renter.toString() === req.user._id.toString();

    if (!isOwner && !isRenter) {
      throw new CustomError('You are not authorized to review this transaction', 403, 'FORBIDDEN');
    }

    const revieweeId = isOwner ? request.renter : request.owner;

    // Check for existing review by this user on this rental request
    const existingReview = await Review.findOne({
      reviewer: req.user._id,
      rentalRequest: request._id,
    });

    if (existingReview) {
      throw new CustomError('You have already submitted a review for this rental', 400, 'DUPLICATE_REVIEW');
    }

    // Create the review
    const newReview = await Review.create({
      reviewer: req.user._id,
      reviewee: revieweeId,
      rentalRequest: request._id,
      rating: parsedRating,
      comment: comment || '',
    });

    // Recalculate reviewee's average rating
    const reviewStats = await Review.aggregate([
      { $match: { reviewee: revieweeId } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          count: { $sum: 1 },
        },
      },
    ]);

    if (reviewStats.length > 0) {
      const { averageRating, count } = reviewStats[0];
      await User.findByIdAndUpdate(revieweeId, {
        ratingAverage: Math.round(averageRating * 10) / 10, // round to 1 decimal place
        ratingCount: count,
      });
    }

    // Notify reviewee
    await createNotification(
      revieweeId,
      'NEW_REVIEW',
      'New Review Received',
      `You received a ${parsedRating}-star rating from ${req.user.fullName}.`,
      newReview._id
    );

    return res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      review: newReview,
    });
  } catch (error) {
    return next(error);
  }
};

export const getUserReviews = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const reviews = await Review.find({ reviewee: req.params.userId })
      .populate('reviewer', 'fullName avatar')
      .populate({
        path: 'rentalRequest',
        populate: {
          path: 'listing',
          select: 'title images',
        },
      })
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      reviews,
    });
  } catch (error) {
    return next(error);
  }
};

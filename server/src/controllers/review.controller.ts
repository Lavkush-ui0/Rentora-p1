import { Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
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
    const { data: request, error: findError } = await supabase
      .from('rental_requests')
      .select('*')
      .eq('id', rentalRequestId)
      .maybeSingle();

    if (findError || !request) {
      throw new CustomError('Rental request not found', 404, 'NOT_FOUND');
    }

    if (request.status !== 'COMPLETED') {
      throw new CustomError('Reviews can only be written for completed rentals', 400, 'RENTAL_NOT_COMPLETED');
    }

    // Verify that the user is either the owner or the renter
    const isOwner = request.owner_id === req.user._id;
    const isRenter = request.renter_id === req.user._id;

    if (!isOwner && !isRenter) {
      throw new CustomError('You are not authorized to review this transaction', 403, 'FORBIDDEN');
    }

    const revieweeId = isOwner ? request.renter_id : request.owner_id;

    // Check for existing review
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('reviewer_id', req.user._id)
      .eq('rental_request_id', request.id)
      .maybeSingle();

    if (existingReview) {
      throw new CustomError('You have already submitted a review for this rental', 400, 'DUPLICATE_REVIEW');
    }

    // Create the review
    const { data: newReview, error: insertErr } = await supabase
      .from('reviews')
      .insert([{
        reviewer_id: req.user._id,
        reviewee_id: revieweeId,
        rental_request_id: request.id,
        rating: parsedRating,
        comment: comment || '',
      }])
      .select()
      .single();

    if (insertErr || !newReview) {
      throw new CustomError('Failed to record review.', 500, 'CREATE_FAILED');
    }

    // Recalculate reviewee's average rating
    const { data: allReviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('reviewee_id', revieweeId);

    if (allReviews && allReviews.length > 0) {
      const sum = allReviews.reduce((total: number, r: any) => total + Number(r.rating), 0);
      const averageRating = sum / allReviews.length;
      await supabase
        .from('users')
        .update({
          rating_average: Math.round(averageRating * 10) / 10,
          rating_count: allReviews.length
        })
        .eq('id', revieweeId);
    }

    // Notify reviewee
    await createNotification(
      revieweeId,
      'NEW_REVIEW',
      'New Review Received',
      `You received a ${parsedRating}-star rating from ${req.user.fullName}.`,
      newReview.id
    );

    return res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      review: {
        _id: newReview.id,
        reviewer: newReview.reviewer_id,
        reviewee: newReview.reviewee_id,
        rating: newReview.rating,
        comment: newReview.comment,
        createdAt: newReview.created_at,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getUserReviews = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('*, reviewer:reviewer_id(id, full_name, avatar), rental_request:rental_request_id(*, listing:listing_id(id, title, images))')
      .eq('reviewee_id', req.params.userId)
      .order('created_at', { ascending: false });

    if (error || !reviews) {
      throw new CustomError('Failed to fetch reviews', 500, 'FETCH_FAILED');
    }

    const formatted = reviews.map((r: any) => ({
      _id: r.id,
      reviewer: r.reviewer ? {
        _id: r.reviewer.id,
        fullName: r.reviewer.full_name,
        avatar: r.reviewer.avatar,
      } : null,
      rentalRequest: r.rental_request ? {
        _id: r.rental_request.id,
        status: r.rental_request.status,
        listing: r.rental_request.listing ? {
          _id: r.rental_request.listing.id,
          title: r.rental_request.listing.title,
          images: r.rental_request.listing.images,
        } : null,
      } : null,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.created_at,
    }));

    return res.json({
      success: true,
      reviews: formatted,
    });
  } catch (error) {
    return next(error);
  }
};

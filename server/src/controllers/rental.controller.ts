import { Response, NextFunction } from 'express';
import { RentalRequest } from '../models/rentalRequest.model';
import { Listing } from '../models/listing.model';
import { User } from '../models/user.model';
import { Conversation, Message } from '../models/chat.model';
import { Review } from '../models/review.model';
import { CustomRequest } from '../types';
import { createNotification } from '../services/notification.service';
import { getIO } from '../services/socket.service';
import CustomError from '../utils/customError';

export const createRentalRequest = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new CustomError('Authentication required', 401, 'UNAUTHORIZED');
    }

    const { listing: listingId, startDate, endDate, message } = req.body;

    const listing = await Listing.findById(listingId);
    if (!listing) {
      throw new CustomError('Listing not found', 404, 'NOT_FOUND');
    }

    if (listing.status !== 'ACTIVE' || !listing.availability) {
      throw new CustomError('Listing is not active or available for rent', 400, 'LISTING_UNAVAILABLE');
    }

    // A user cannot request their own listing
    if (listing.owner.toString() === req.user._id.toString()) {
      throw new CustomError('You cannot request your own listing', 400, 'SELF_RENTAL_PROHIBITED');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Verify dates are valid
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new CustomError('Invalid dates provided', 400, 'INVALID_DATES');
    }

    if (start < new Date(new Date().setHours(0, 0, 0, 0))) {
      throw new CustomError('Start date cannot be in the past', 400, 'INVALID_START_DATE');
    }

    // Check for conflicting ACTIVE or ACCEPTED rentals
    const conflict = await RentalRequest.findOne({
      listing: listingId,
      status: { $in: ['ACCEPTED', 'ACTIVE'] },
      $or: [
        { startDate: { $lte: end }, endDate: { $gte: start } },
      ],
    });

    if (conflict) {
      throw new CustomError('This item is already booked/rented for the requested dates', 400, 'DATE_CONFLICT');
    }

    const request = await RentalRequest.create({
      listing: listingId,
      owner: listing.owner,
      renter: req.user._id,
      startDate: start,
      endDate: end,
      message: message || '',
      status: 'PENDING',
    });

    // Increment request count on the listing
    listing.requestCount += 1;
    await listing.save();

    // Auto-create or find conversation thread between Renter & Owner for this listing
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, listing.owner] },
      listing: listingId,
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user._id, listing.owner],
        listing: listingId,
        rentalRequest: request._id,
      });
    } else {
      conversation.rentalRequest = request._id as any;
      await conversation.save();
    }

    // Create initial chat message so owner sees the user's message in the chat
    const requestMessageText = message?.trim()
      ? message.trim()
      : `Hi! I've sent a request to rent "${listing.title}" from ${start.toLocaleDateString()} to ${end.toLocaleDateString()}.`;

    const initialMessage = await Message.create({
      conversation: conversation._id,
      sender: req.user._id,
      text: requestMessageText,
    });

    conversation.lastMessage = initialMessage._id as any;
    await conversation.save();

    // Broadcast live socket message event to conversation room
    const io = getIO();
    if (io) {
      const populatedMsg = await initialMessage.populate('sender', 'fullName avatar');
      io.to(conversation._id.toString()).emit('receiveMessage', populatedMsg);
    }

    // Create notification for listing owner (pointing to the conversation ID)
    await createNotification(
      listing.owner,
      'RENTAL_REQUEST',
      'New Rental Request',
      `${req.user.fullName} requested "${listing.title}": "${requestMessageText.substring(0, 60)}${requestMessageText.length > 60 ? '...' : ''}"`,
      conversation._id
    );

    return res.status(201).json({
      success: true,
      message: 'Rental request sent & chat initiated successfully',
      request,
      conversationId: conversation._id,
    });
  } catch (error) {
    return next(error);
  }
};

export const getIncomingRequests = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new CustomError('Authentication required', 401, 'UNAUTHORIZED');
    }

    const requests = await RentalRequest.find({ owner: req.user._id })
      .populate('listing', 'title images status priceUnit rentalPrice')
      .populate('renter', 'fullName avatar ratingAverage')
      .sort({ createdAt: -1 });

    const requestIds = requests.map(r => r._id);
    const reviews = await Review.find({
      reviewer: req.user._id,
      rentalRequest: { $in: requestIds }
    });
    const reviewedRequestIds = new Set(reviews.map(r => r.rentalRequest.toString()));

    const requestsWithReviewStatus = requests.map(r => {
      const obj = r.toObject();
      return {
        ...obj,
        hasReviewed: reviewedRequestIds.has(r._id.toString())
      };
    });

    return res.json({
      success: true,
      requests: requestsWithReviewStatus,
    });
  } catch (error) {
    return next(error);
  }
};

export const getSentRequests = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new CustomError('Authentication required', 401, 'UNAUTHORIZED');
    }

    const requests = await RentalRequest.find({ renter: req.user._id })
      .populate('listing', 'title images status priceUnit rentalPrice')
      .populate('owner', 'fullName avatar ratingAverage')
      .sort({ createdAt: -1 });

    const requestIds = requests.map(r => r._id);
    const reviews = await Review.find({
      reviewer: req.user._id,
      rentalRequest: { $in: requestIds }
    });
    const reviewedRequestIds = new Set(reviews.map(r => r.rentalRequest.toString()));

    const requestsWithReviewStatus = requests.map(r => {
      const obj = r.toObject();
      return {
        ...obj,
        hasReviewed: reviewedRequestIds.has(r._id.toString())
      };
    });

    return res.json({
      success: true,
      requests: requestsWithReviewStatus,
    });
  } catch (error) {
    return next(error);
  }
};

export const getRentalRequestById = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new CustomError('Authentication required', 401, 'UNAUTHORIZED');
    }

    const request = await RentalRequest.findById(req.params.id)
      .populate('listing', 'title images condition rentalPrice priceUnit securityDeposit status availability')
      .populate('owner', 'fullName avatar ratingAverage ratingCount completedRentals bio')
      .populate('renter', 'fullName avatar ratingAverage ratingCount completedRentals bio');

    if (!request) {
      throw new CustomError('Rental request not found', 404, 'NOT_FOUND');
    }

    // Verify authorized user
    const isOwner = request.owner._id.toString() === req.user._id.toString();
    const isRenter = request.renter._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'ADMIN';

    if (!isOwner && !isRenter && !isAdmin) {
      throw new CustomError('You are not authorized to view this request', 403, 'FORBIDDEN');
    }

    return res.json({
      success: true,
      request,
    });
  } catch (error) {
    return next(error);
  }
};

export const acceptRentalRequest = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new CustomError('Authentication required', 401, 'UNAUTHORIZED');
    }

    const request = await RentalRequest.findById(req.params.id);
    if (!request) {
      throw new CustomError('Rental request not found', 404, 'NOT_FOUND');
    }

    if (request.owner.toString() !== req.user._id.toString()) {
      throw new CustomError('Only the item owner can accept requests', 403, 'FORBIDDEN');
    }

    if (request.status !== 'PENDING') {
      throw new CustomError(`Cannot accept a request with status "${request.status}"`, 400, 'INVALID_TRANSITION');
    }

    // Double check that listing is still available
    const listing = await Listing.findById(request.listing);
    if (!listing) {
      throw new CustomError('Listing no longer exists', 404, 'NOT_FOUND');
    }

    // Generate a 4-digit handover OTP code
    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
    request.handoverOTP = otpCode;
    request.status = 'ACCEPTED';
    await request.save();

    // Mark listing unavailable so other students cannot rent it
    listing.availability = false;
    await listing.save();

    // Reject all other pending requests for the same listing that overlap
    const conflictingRequests = await RentalRequest.find({
      listing: request.listing,
      _id: { $ne: request._id },
      status: 'PENDING',
      $or: [
        { startDate: { $lte: request.endDate }, endDate: { $gte: request.startDate } },
      ],
    });

    for (const confReq of conflictingRequests) {
      confReq.status = 'REJECTED';
      await confReq.save();
      await createNotification(
        confReq.renter,
        'REQUEST_REJECTED',
        'Request Rejected (Date Conflict)',
        `Your request for "${listing.title}" was automatically rejected because the owner accepted another request for overlapping dates.`,
        confReq._id
      );
    }

    // Set up chat context: Auto-create a Conversation between renter and owner for this rental context
    let conversation = await Conversation.findOne({
      participants: { $all: [request.owner, request.renter] },
      listing: request.listing,
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [request.owner, request.renter],
        listing: request.listing,
        rentalRequest: request._id,
      });
    } else {
      conversation.rentalRequest = request._id;
      await conversation.save();
    }

    // Notify renter
    await createNotification(
      request.renter,
      'REQUEST_ACCEPTED',
      'Rental Request Accepted',
      `Your request to rent "${listing.title}" has been accepted! You can now chat to coordinate pickup.`,
      conversation._id
    );

    return res.json({
      success: true,
      message: 'Rental request accepted successfully',
      request,
      conversationId: conversation._id,
    });
  } catch (error) {
    return next(error);
  }
};

export const rejectRentalRequest = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new CustomError('Authentication required', 401, 'UNAUTHORIZED');
    }

    const request = await RentalRequest.findById(req.params.id);
    if (!request) {
      throw new CustomError('Rental request not found', 404, 'NOT_FOUND');
    }

    if (request.owner.toString() !== req.user._id.toString()) {
      throw new CustomError('Only the item owner can reject requests', 403, 'FORBIDDEN');
    }

    if (request.status !== 'PENDING') {
      throw new CustomError(`Cannot reject a request with status "${request.status}"`, 400, 'INVALID_TRANSITION');
    }

    request.status = 'REJECTED';
    await request.save();

    const listing = await Listing.findById(request.listing);

    // Notify renter
    await createNotification(
      request.renter,
      'REQUEST_REJECTED',
      'Rental Request Rejected',
      `Your request to rent "${listing?.title || 'an item'}" was declined by the owner.`,
      request._id
    );

    return res.json({
      success: true,
      message: 'Rental request rejected successfully',
      request,
    });
  } catch (error) {
    return next(error);
  }
};

export const cancelRentalRequest = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new CustomError('Authentication required', 401, 'UNAUTHORIZED');
    }

    const request = await RentalRequest.findById(req.params.id);
    if (!request) {
      throw new CustomError('Rental request not found', 404, 'NOT_FOUND');
    }

    const isRenter = request.renter.toString() === req.user._id.toString();
    const isOwner = request.owner.toString() === req.user._id.toString();

    if (!isRenter && !isOwner) {
      throw new CustomError('You are not authorized to cancel this request', 403, 'FORBIDDEN');
    }

    if (request.status !== 'PENDING' && request.status !== 'ACCEPTED') {
      throw new CustomError(`Cannot cancel a request that is "${request.status}"`, 400, 'INVALID_TRANSITION');
    }

    const wasAccepted = request.status === 'ACCEPTED';
    request.status = 'CANCELLED';
    await request.save();

    const listing = await Listing.findById(request.listing);
    
    // If it was accepted, restore listing availability
    if (wasAccepted && listing) {
      listing.availability = true;
      await listing.save();
    }

    // Notify other party
    const recipient = isRenter ? request.owner : request.renter;
    const senderName = req.user.fullName;
    await createNotification(
      recipient,
      'REQUEST_REJECTED',
      'Rental Request Cancelled',
      `The rental request for "${listing?.title || 'an item'}" has been cancelled by ${senderName}.`,
      request._id
    );

    return res.json({
      success: true,
      message: 'Rental request cancelled successfully',
      request,
    });
  } catch (error) {
    return next(error);
  }
};

export const handoverRentalRequest = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new CustomError('Authentication required', 401, 'UNAUTHORIZED');
    }

    const { otp } = req.body;
    if (!otp) {
      throw new CustomError('Handover OTP code is required', 400, 'OTP_REQUIRED');
    }

    const request = await RentalRequest.findById(req.params.id);
    if (!request) {
      throw new CustomError('Rental request not found', 404, 'NOT_FOUND');
    }

    // Handover should be initiated/confirmed by the owner
    if (request.owner.toString() !== req.user._id.toString()) {
      throw new CustomError('Only the owner can confirm handover/activation', 403, 'FORBIDDEN');
    }

    if (request.status !== 'ACCEPTED') {
      throw new CustomError(`Handover cannot be confirmed for status "${request.status}"`, 400, 'INVALID_TRANSITION');
    }

    if (request.handoverOTP !== otp) {
      throw new CustomError('Invalid handover verification code (OTP). Please check with the renter.', 400, 'INVALID_OTP');
    }

    const listing = await Listing.findById(request.listing);
    if (!listing) {
      throw new CustomError('Listing not found', 404, 'NOT_FOUND');
    }

    const renterUser = await User.findById(request.renter);
    if (!renterUser) {
      throw new CustomError('Renter account not found', 404, 'NOT_FOUND');
    }

    // Calculate duration in days (minimum 1 day)
    const durationMs = Math.max(1, request.endDate.getTime() - request.startDate.getTime());
    const days = Math.ceil(durationMs / (1000 * 60 * 60 * 24));
    const rentalFee = listing.rentalPrice * days;
    const securityDeposit = listing.securityDeposit;
    const totalRequired = rentalFee + securityDeposit;

    if (renterUser.walletBalance < totalRequired) {
      throw new CustomError(
        `Renter has insufficient wallet balance. Required: ₹${totalRequired}, Current Balance: ₹${renterUser.walletBalance}.`,
        400,
        'INSUFFICIENT_BALANCE'
      );
    }

    // Deduct from renter's wallet
    renterUser.walletBalance -= totalRequired;
    await renterUser.save();

    request.heldDeposit = securityDeposit;
    request.rentalPricePaid = rentalFee;
    request.status = 'ACTIVE';
    await request.save();

    if (listing) {
      listing.status = 'RENTED';
      await listing.save();
    }

    // Notify renter
    await createNotification(
      request.renter,
      'RENTAL_REMINDER',
      'Rental Active (Handover Confirmed)',
      `Handover for "${listing?.title || 'your item'}" is confirmed. Your rental is now ACTIVE!`,
      request._id
    );

    return res.json({
      success: true,
      message: 'Rental is now ACTIVE',
      request,
    });
  } catch (error) {
    return next(error);
  }
};

export const completeRentalRequest = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new CustomError('Authentication required', 401, 'UNAUTHORIZED');
    }

    const request = await RentalRequest.findById(req.params.id);
    if (!request) {
      throw new CustomError('Rental request not found', 404, 'NOT_FOUND');
    }

    // Completion is confirmed by owner when item is returned
    if (request.owner.toString() !== req.user._id.toString()) {
      throw new CustomError('Only the owner can confirm rental completion', 403, 'FORBIDDEN');
    }

    if (request.status !== 'ACTIVE') {
      throw new CustomError(`Rental cannot be completed from status "${request.status}"`, 400, 'INVALID_TRANSITION');
    }

    // Refund renter's security deposit
    const renterUser = await User.findById(request.renter);
    if (renterUser) {
      renterUser.walletBalance += request.heldDeposit;
      await renterUser.save();
    }

    // Pay owner the rental income fee
    const ownerUser = await User.findById(request.owner);
    if (ownerUser) {
      ownerUser.walletBalance += request.rentalPricePaid;
      await ownerUser.save();
    }

    request.status = 'COMPLETED';
    await request.save();

    // Increment completed rental stats on both users
    await User.findByIdAndUpdate(request.owner, { $inc: { completedRentals: 1 } });
    await User.findByIdAndUpdate(request.renter, { $inc: { completedRentals: 1 } });

    // Restore listing availability and status to ACTIVE
    const listing = await Listing.findById(request.listing);
    if (listing) {
      listing.status = 'ACTIVE';
      listing.availability = true;
      await listing.save();
    }

    // Notify renter
    await createNotification(
      request.renter,
      'RENTAL_COMPLETED',
      'Rental Completed',
      `Your rental of "${listing?.title || 'the item'}" has been marked COMPLETED. Please write a review for the owner!`,
      request._id
    );

    // Notify owner
    await createNotification(
      request.owner,
      'RENTAL_COMPLETED',
      'Rental Completed',
      `You marked the rental of "${listing?.title || 'your item'}" as COMPLETED. Please rate the renter!`,
      request._id
    );

    return res.json({
      success: true,
      message: 'Rental completed successfully',
      request,
    });
  } catch (error) {
    return next(error);
  }
};

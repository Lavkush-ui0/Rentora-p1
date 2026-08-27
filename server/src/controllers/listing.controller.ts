import { Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import { CustomRequest } from '../types';
import { uploadImage, deleteImage } from '../services/image.service';
import { moderateListingWithAI, isAiModerationEnabled } from '../services/aiModeration.service';
import CustomError from '../utils/customError';
import { clearHomepageCache } from './discovery.controller';

export const createListing = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new CustomError('Authentication required', 401, 'UNAUTHORIZED');
    }

    const { title, description, category, condition, rentalPrice, priceUnit, securityDeposit, location } = req.body;

    // Enforce daily listing limits: max 2 products per day and check if rejected today
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const { count: dailyCount, error: countErr } = await supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', req.user._id)
      .gte('created_at', oneDayAgo.toISOString());

    if (dailyCount !== null && dailyCount >= 2) {
      throw new CustomError('You can only list up to 2 products per day.', 400, 'DAILY_LIMIT_EXCEEDED');
    }

    const { count: rejectedToday } = await supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', req.user._id)
      .eq('approval_status', 'REJECTED')
      .gte('updated_at', oneDayAgo.toISOString());

    if (rejectedToday !== null && rejectedToday > 0) {
      throw new CustomError('Your listing was rejected today. Please try again tomorrow.', 400, 'REJECTED_COOLDOWN');
    }

    // Verify category exists
    const { data: categoryExists } = await supabase
      .from('categories')
      .select('*')
      .eq('id', category)
      .maybeSingle();

    if (!categoryExists) {
      throw new CustomError('Invalid category ID', 400, 'INVALID_CATEGORY');
    }

    // Handle uploaded files
    const imageUrls: string[] = [];
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      const uploadPromises = (req.files as Express.Multer.File[]).map(file =>
        uploadImage(file.buffer, 'rentora/listings', file.mimetype)
      );
      const results = await Promise.all(uploadPromises);
      imageUrls.push(...results);
    } else if (req.body.images && Array.isArray(req.body.images) && req.body.images.length > 0) {
      imageUrls.push(...req.body.images);
    } else {
      throw new CustomError('At least one item photo is required.', 400, 'PHOTO_REQUIRED');
    }

    // Create unique slug
    const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const uniqueSlug = `${cleanTitle}-${Math.random().toString(36).substring(2, 7)}`;

    // Extract location coordinates and client IP (mandatory)
    const { latitude, longitude } = req.body;
    if (!latitude || !longitude) {
      throw new CustomError('GPS Location Coordinates are required to list an item on the portal.', 400, 'COORDINATES_REQUIRED');
    }
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
    const postIpAddress = Array.isArray(clientIp) ? clientIp[0] : clientIp;

    // AI Safety & Content Moderation Shield via Groq (Controlled by Admin Toggle)
    const aiEnabled = isAiModerationEnabled();
    let isAutoApproved = false;
    let rejectionReason = '';

    if (aiEnabled) {
      const moderation = await moderateListingWithAI({
        title,
        description,
        condition,
        rentalPrice: Number(rentalPrice),
        priceUnit,
      });
      isAutoApproved = moderation.isSafe;
      rejectionReason = isAutoApproved ? '' : (moderation.reason || 'Flagged for admin moderation');
    } else {
      isAutoApproved = false;
      rejectionReason = 'AI auto-approval is paused. Submitted for manual admin review.';
    }

    const initialApprovalStatus = isAutoApproved ? 'APPROVED' : 'PENDING';
    const initialStatus = isAutoApproved ? 'ACTIVE' : 'PAUSED';
    const initialAvailability = isAutoApproved ? true : false;

    const { data: newListing, error: insertError } = await supabase
      .from('listings')
      .insert([{
        owner_id: req.user._id,
        title,
        slug: uniqueSlug,
        description,
        category_id: category,
        images: imageUrls,
        condition,
        rental_price: Number(rentalPrice),
        price_unit: priceUnit,
        security_deposit: Number(securityDeposit || 0),
        availability: initialAvailability,
        status: initialStatus,
        approval_status: initialApprovalStatus,
        rejection_reason: rejectionReason,
        location: location || req.user.collegeName || 'NIET Plot 19',
        post_ip_address: postIpAddress,
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null,
      }])
      .select()
      .single();

    if (insertError || !newListing) {
      throw new CustomError('Failed to create listing in database.', 500, 'CREATE_FAILED');
    }

    clearHomepageCache();

    const responseMessage = isAutoApproved
      ? 'Listing verified by Rentora AI Shield and is now live on campus!'
      : 'Listing submitted and is waiting for admin approval.';

    return res.status(201).json({
      success: true,
      autoApproved: isAutoApproved,
      message: responseMessage,
      listing: {
        _id: newListing.id,
        owner: newListing.owner_id,
        title: newListing.title,
        slug: newListing.slug,
        description: newListing.description,
        images: newListing.images,
        condition: newListing.condition,
        rentalPrice: Number(newListing.rental_price),
        priceUnit: newListing.price_unit,
        securityDeposit: Number(newListing.security_deposit),
        availability: newListing.availability,
        status: newListing.status,
        approvalStatus: newListing.approval_status,
        location: newListing.location,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getListings = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const { category, minPrice, maxPrice, condition, priceUnit, status, search, sort, page, limit, owner, location } = req.query as any;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const fromRange = (pageNum - 1) * limitNum;
    const toRange = fromRange + limitNum - 1;

    let query = supabase
      .from('listings')
      .select('*, owner:owner_id (id, full_name, avatar, rating_average), category:category_id (id, name, slug)', { count: 'exact' });

    // Filter by owner
    if (owner) {
      query = query.eq('owner_id', owner);
    }

    // Filter by location
    if (location && location !== 'All') {
      query = query.eq('location', location);
    }

    // Filter by category (uuid or slug/name lookup)
    if (category && typeof category === 'string' && category.trim()) {
      const cleanCat = category.trim();
      const isUUID = cleanCat.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/);
      if (isUUID) {
        query = query.eq('category_id', cleanCat);
      } else {
        const { data: catRecord } = await supabase
          .from('categories')
          .select('id')
          .or(`slug.eq.${cleanCat},name.ilike.${cleanCat}`)
          .maybeSingle();

        if (catRecord) {
          query = query.eq('category_id', catRecord.id);
        }
      }
    }

    if (condition) query = query.eq('condition', condition);
    if (priceUnit) query = query.eq('price_unit', priceUnit);

    // Default status ACTIVE
    query = query.eq('status', status || 'ACTIVE');

    // If not owner query, only show APPROVED
    if (!owner) {
      query = query.eq('approval_status', 'APPROVED');
    }

    // Price filters
    if (minPrice !== undefined) query = query.gte('rental_price', parseFloat(minPrice));
    if (maxPrice !== undefined) query = query.lte('rental_price', parseFloat(maxPrice));

    // Full text search
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Sorting
    let sortCol = 'created_at';
    let ascending = false;
    if (sort) {
      switch (sort) {
        case 'price_asc':
          sortCol = 'rental_price';
          ascending = true;
          break;
        case 'price_desc':
          sortCol = 'rental_price';
          ascending = false;
          break;
        case 'newest':
          sortCol = 'created_at';
          ascending = false;
          break;
        case 'popular':
          sortCol = 'view_count';
          ascending = false;
          break;
        case 'trending':
          sortCol = 'request_count';
          ascending = false;
          break;
      }
    }
    query = query.order(sortCol, { ascending }).range(fromRange, toRange);

    const { data: dbListings, count: total, error: queryErr } = await query;
    if (queryErr || !dbListings) {
      throw new CustomError('Failed to fetch listings catalog.', 500, 'FETCH_FAILED');
    }

    const totalCount = total || 0;

    const listingIds = dbListings.map((l: any) => l.id);
    let rentals: any[] = [];
    if (listingIds.length > 0) {
      const { data: rentalsData } = await supabase
        .from('rental_requests')
        .select('listing_id, start_date, end_date, status')
        .in('listing_id', listingIds)
        .in('status', ['ACCEPTED', 'ACTIVE']);
      if (rentalsData) {
        rentals = rentalsData;
      }
    }

    const formattedListings = dbListings.map((l: any) => {
      const activeRental = rentals.find((r: any) => r.listing_id === l.id);
      return {
        _id: l.id,
        owner: l.owner ? {
          _id: l.owner.id,
          fullName: l.owner.full_name,
          avatar: l.owner.avatar,
          ratingAverage: Number(l.owner.rating_average)
        } : null,
        category: l.category ? {
          _id: l.category.id,
          name: l.category.name,
          slug: l.category.slug
        } : null,
        title: l.title,
        slug: l.slug,
        description: l.description,
        images: l.images,
        condition: l.condition,
        rentalPrice: Number(l.rental_price),
        priceUnit: l.price_unit,
        securityDeposit: Number(l.security_deposit),
        availability: l.availability,
        status: l.status,
        approvalStatus: l.approval_status,
        location: l.location,
        requestCount: l.request_count,
        submissionCount: l.submission_count,
        viewCount: l.view_count,
        postIpAddress: l.post_ip_address,
        postCoordinates: { latitude: l.latitude, longitude: l.longitude },
        createdAt: l.created_at,
        updatedAt: l.updated_at,
        rentedPeriod: activeRental ? {
          startDate: activeRental.start_date,
          endDate: activeRental.end_date,
          status: activeRental.status,
        } : null,
      };
    });

    return res.json({
      success: true,
      listings: formattedListings,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalCount / limitNum),
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getListingById = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const { data: l, error } = await supabase
      .from('listings')
      .select('*, owner:owner_id (id, full_name, email, avatar, rating_average, rating_count, completed_rentals, bio, created_at), category:category_id (id, name, slug)')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error || !l) {
      throw new CustomError('Listing not found', 404, 'NOT_FOUND');
    }

    const formattedListing = {
      _id: l.id,
      owner: l.owner ? {
        _id: l.owner.id,
        fullName: l.owner.full_name,
        email: l.owner.email,
        avatar: l.owner.avatar,
        bio: l.owner.bio,
        ratingAverage: Number(l.owner.rating_average),
        ratingCount: l.owner.rating_count,
        completedRentals: l.owner.completed_rentals,
        createdAt: l.owner.created_at
      } : null,
      category: l.category ? {
        _id: l.category.id,
        name: l.category.name,
        slug: l.category.slug
      } : null,
      title: l.title,
      slug: l.slug,
      description: l.description,
      images: l.images,
      condition: l.condition,
      rentalPrice: Number(l.rental_price),
      priceUnit: l.price_unit,
      securityDeposit: Number(l.security_deposit),
      availability: l.availability,
      status: l.status,
      approvalStatus: l.approval_status,
      location: l.location,
      requestCount: l.request_count,
      submissionCount: l.submission_count,
      viewCount: l.view_count,
      postIpAddress: l.post_ip_address,
      postCoordinates: { latitude: l.latitude, longitude: l.longitude },
      createdAt: l.created_at,
      updatedAt: l.updated_at
    };

    // Find active bookings to block out dates in calendar
    const { data: bookings } = await supabase
      .from('rental_requests')
      .select('start_date, end_date')
      .eq('listing_id', formattedListing._id)
      .in('status', ['APPROVED', 'ACTIVE']);

    const blockedDates = bookings ? bookings.map((r: any) => ({
      start: r.start_date,
      end: r.end_date
    })) : [];

    return res.json({
      success: true,
      listing: formattedListing,
      blockedDates
    });
  } catch (error) {
    return next(error);
  }
};

export const updateListing = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new CustomError('Authentication required', 401, 'UNAUTHORIZED');
    }

    const { data: listing, error: findError } = await supabase
      .from('listings')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (findError || !listing) {
      throw new CustomError('Listing not found', 404, 'NOT_FOUND');
    }

    const isOwner = listing.owner_id === req.user._id;
    const isAdmin = req.user.role === 'ADMIN';
    if (!isOwner && !isAdmin) {
      throw new CustomError('You are not authorized to update this listing', 403, 'FORBIDDEN');
    }

    if (!isAdmin) {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const { count: rejectedToday } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', req.user._id)
        .eq('approval_status', 'REJECTED')
        .gte('updated_at', oneDayAgo.toISOString());

      if (rejectedToday !== null && rejectedToday > 0) {
        throw new CustomError('Your listing was rejected today. Please wait until tomorrow to update or list items.', 400, 'REJECTED_COOLDOWN');
      }
    }

    const { title, description, category, condition, rentalPrice, priceUnit, securityDeposit, availability, status, location, latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      throw new CustomError('GPS Location Coordinates are required to edit/resubmit an item on the portal.', 400, 'COORDINATES_REQUIRED');
    }

    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
    const postIpAddress = Array.isArray(clientIp) ? clientIp[0] : clientIp;

    if (category) {
      const { data: categoryExists } = await supabase
        .from('categories')
        .select('*')
        .eq('id', category)
        .maybeSingle();
      if (!categoryExists) {
        throw new CustomError('Invalid category ID', 400, 'INVALID_CATEGORY');
      }
    }

    let uniqueSlug = listing.slug;
    if (title) {
      const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      uniqueSlug = `${cleanTitle}-${Math.random().toString(36).substring(2, 7)}`;
    }

    let imageUrls = listing.images || [];
    if (req.body.existingImages) {
      try {
        const keep = JSON.parse(req.body.existingImages);
        if (Array.isArray(keep)) {
          const removed = imageUrls.filter((url: string) => !keep.includes(url));
          removed.forEach((img: string) => {
            if (!img.includes('picsum.photos')) {
              deleteImage(img);
            }
          });
          imageUrls = keep;
        }
      } catch (err) {
        console.error('Failed to parse existingImages:', err);
      }
    }

    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      const uploadPromises = (req.files as Express.Multer.File[]).map(file =>
        uploadImage(file.buffer, 'rentora/listings', file.mimetype)
      );
      const results = await Promise.all(uploadPromises);
      imageUrls = [...imageUrls, ...results];
    }

    const { data: updatedListing, error: updateError } = await supabase
      .from('listings')
      .update({
        title: title || listing.title,
        slug: uniqueSlug,
        description: description || listing.description,
        category_id: category || listing.category_id,
        images: imageUrls,
        condition: condition || listing.condition,
        rental_price: rentalPrice !== undefined ? Number(rentalPrice) : Number(listing.rental_price),
        price_unit: priceUnit || listing.price_unit,
        security_deposit: securityDeposit !== undefined ? Number(securityDeposit) : Number(listing.security_deposit),
        availability: !isAdmin ? false : (availability !== undefined ? Boolean(availability) : listing.availability),
        status: !isAdmin ? 'PAUSED' : (status || listing.status),
        approval_status: !isAdmin ? 'PENDING' : (listing.approval_status),
        rejection_reason: !isAdmin ? '' : (listing.rejection_reason),
        submission_count: !isAdmin ? (listing.submission_count || 1) + 1 : listing.submission_count,
        location: location || listing.location,
        post_ip_address: postIpAddress,
        latitude: Number(latitude),
        longitude: Number(longitude),
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (updateError || !updatedListing) {
      throw new CustomError('Failed to update listing in database.', 500, 'UPDATE_FAILED');
    }

    clearHomepageCache();

    return res.json({
      success: true,
      message: isAdmin ? 'Listing updated successfully.' : 'Listing updated and submitted for admin review.',
      listing: {
        _id: updatedListing.id,
        owner: updatedListing.owner_id,
        title: updatedListing.title,
        slug: updatedListing.slug,
        description: updatedListing.description,
        images: updatedListing.images,
        condition: updatedListing.condition,
        rentalPrice: Number(updatedListing.rental_price),
        priceUnit: updatedListing.price_unit,
        securityDeposit: Number(updatedListing.security_deposit),
        availability: updatedListing.availability,
        status: updatedListing.status,
        approvalStatus: updatedListing.approval_status,
        location: updatedListing.location,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteListing = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new CustomError('Authentication required', 401, 'UNAUTHORIZED');
    }

    const { data: listing, error: findError } = await supabase
      .from('listings')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (findError || !listing) {
      throw new CustomError('Listing not found', 404, 'NOT_FOUND');
    }

    const isOwner = listing.owner_id === req.user._id;
    const isAdmin = req.user.role === 'ADMIN';
    if (!isOwner && !isAdmin) {
      throw new CustomError('You are not authorized to delete this listing', 403, 'FORBIDDEN');
    }

    // Soft delete
    await supabase
      .from('listings')
      .update({ status: 'REMOVED', availability: false })
      .eq('id', req.params.id);

    clearHomepageCache();

    return res.json({
      success: true,
      message: 'Listing removed successfully',
    });
  } catch (error) {
    return next(error);
  }
};

export const pauseListing = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new CustomError('Authentication required', 401, 'UNAUTHORIZED');
    }

    const { data: listing, error: findError } = await supabase
      .from('listings')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (findError || !listing) {
      throw new CustomError('Listing not found', 404, 'NOT_FOUND');
    }

    if (listing.owner_id !== req.user._id) {
      throw new CustomError('Only the owner can toggle listing status', 403, 'FORBIDDEN');
    }

    let newStatus = 'PAUSED';
    let newAvail = false;

    if (listing.status === 'ACTIVE') {
      newStatus = 'PAUSED';
      newAvail = false;
    } else if (listing.status === 'PAUSED') {
      if (listing.approval_status !== 'APPROVED') {
        throw new CustomError('This listing is awaiting admin approval and cannot be made active yet.', 400, 'NOT_APPROVED');
      }
      newStatus = 'ACTIVE';
      newAvail = true;
    } else {
      throw new CustomError(`Cannot toggle status when listing is ${listing.status}`, 400, 'INVALID_STATUS');
    }

    const { data: updatedListing, error: updateError } = await supabase
      .from('listings')
      .update({ status: newStatus, availability: newAvail })
      .eq('id', req.params.id)
      .select()
      .single();

    if (updateError || !updatedListing) {
      throw new CustomError('Failed to toggle status.', 500, 'TOGGLE_FAILED');
    }

    clearHomepageCache();

    return res.json({
      success: true,
      message: `Listing status updated to ${updatedListing.status}`,
      listing: {
        _id: updatedListing.id,
        owner: updatedListing.owner_id,
        title: updatedListing.title,
        slug: updatedListing.slug,
        description: updatedListing.description,
        images: updatedListing.images,
        condition: updatedListing.condition,
        rentalPrice: Number(updatedListing.rental_price),
        priceUnit: updatedListing.price_unit,
        securityDeposit: Number(updatedListing.security_deposit),
        availability: updatedListing.availability,
        status: updatedListing.status,
        approvalStatus: updatedListing.approval_status,
        location: updatedListing.location,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const viewListing = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const { data: listing } = await supabase
      .from('listings')
      .select('view_count')
      .eq('id', req.params.id)
      .maybeSingle();

    if (!listing) {
      throw new CustomError('Listing not found', 404, 'NOT_FOUND');
    }

    const newViews = (listing.view_count || 0) + 1;
    await supabase
      .from('listings')
      .update({ view_count: newViews })
      .eq('id', req.params.id);

    return res.json({
      success: true,
      viewCount: newViews,
    });
  } catch (error) {
    return next(error);
  }
};

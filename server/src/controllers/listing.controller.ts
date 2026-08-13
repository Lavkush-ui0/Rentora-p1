import { Response, NextFunction } from 'express';
import { Listing } from '../models/listing.model';
import { Category } from '../models/category.model';
import { CustomRequest } from '../types';
import { uploadImage, deleteImage } from '../services/cloudinary.service';
import CustomError from '../utils/customError';

export const createListing = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new CustomError('Authentication required', 401, 'UNAUTHORIZED');
    }

    const { title, description, category, condition, rentalPrice, priceUnit, securityDeposit } = req.body;

    // Verify category exists
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      throw new CustomError('Invalid category ID', 400, 'INVALID_CATEGORY');
    }

    // Handle uploaded files
    const imageUrls: string[] = [];
    if (req.files && Array.isArray(req.files)) {
      const uploadPromises = (req.files as Express.Multer.File[]).map(file =>
        uploadImage(file.buffer, 'rentora/listings', file.mimetype)
      );
      const results = await Promise.all(uploadPromises);
      imageUrls.push(...results);
    }

    // Default image if none uploaded
    if (imageUrls.length === 0) {
      imageUrls.push('https://picsum.photos/600/400'); // placeholder
    }

    // Create unique slug
    const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const uniqueSlug = `${cleanTitle}-${Math.random().toString(36).substring(2, 7)}`;

    const newListing = await Listing.create({
      owner: req.user._id,
      title,
      slug: uniqueSlug,
      description,
      category,
      images: imageUrls,
      condition,
      rentalPrice,
      priceUnit,
      securityDeposit: securityDeposit || 0,
      availability: true,
      status: 'ACTIVE',
    });

    return res.status(201).json({
      success: true,
      message: 'Listing created successfully',
      listing: newListing,
    });
  } catch (error) {
    return next(error);
  }
};

export const getListings = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const { category, minPrice, maxPrice, condition, priceUnit, status, search, sort, page, limit, owner } = req.query as any;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    const filter: any = {};

    // Filter by owner if provided
    if (owner) {
      filter.owner = owner;
    }

    // Standard filter matches
    if (category) filter.category = category;
    if (condition) filter.condition = condition;
    if (priceUnit) filter.priceUnit = priceUnit;
    
    // Default to ACTIVE listings unless querying specific status
    filter.status = status || 'ACTIVE';

    // Price filters
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.rentalPrice = {};
      if (minPrice !== undefined) filter.rentalPrice.$gte = parseFloat(minPrice);
      if (maxPrice !== undefined) filter.rentalPrice.$lte = parseFloat(maxPrice);
    }

    // Full text search
    if (search) {
      filter.$text = { $search: search };
    }

    // Sorting
    let sortQuery: any = { createdAt: -1 }; // default newest
    if (sort) {
      switch (sort) {
        case 'price_asc':
          sortQuery = { rentalPrice: 1 };
          break;
        case 'price_desc':
          sortQuery = { rentalPrice: -1 };
          break;
        case 'newest':
          sortQuery = { createdAt: -1 };
          break;
        case 'popular':
          sortQuery = { viewCount: -1 };
          break;
        case 'trending':
          sortQuery = { requestCount: -1, createdAt: -1 };
          break;
      }
    }

    const listings = await Listing.find(filter)
      .sort(sortQuery)
      .skip(skip)
      .limit(limitNum)
      .populate('owner', 'fullName avatar ratingAverage')
      .populate('category', 'name slug');

    const total = await Listing.countDocuments(filter);

    return res.json({
      success: true,
      listings,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getListingById = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate('owner', 'fullName avatar ratingAverage ratingCount completedRentals bio createdAt')
      .populate('category', 'name slug');

    if (!listing) {
      throw new CustomError('Listing not found', 404, 'NOT_FOUND');
    }

    return res.json({
      success: true,
      listing,
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

    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      throw new CustomError('Listing not found', 404, 'NOT_FOUND');
    }

    // Verify ownership or admin role
    const isOwner = listing.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'ADMIN';
    if (!isOwner && !isAdmin) {
      throw new CustomError('You are not authorized to update this listing', 403, 'FORBIDDEN');
    }

    const { title, description, category, condition, rentalPrice, priceUnit, securityDeposit, availability, status } = req.body;

    if (category) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        throw new CustomError('Invalid category ID', 400, 'INVALID_CATEGORY');
      }
      listing.category = category;
    }

    if (title) {
      listing.title = title;
      // Regenerate slug
      const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      listing.slug = `${cleanTitle}-${Math.random().toString(36).substring(2, 7)}`;
    }

    if (description) listing.description = description;
    if (condition) listing.condition = condition;
    if (rentalPrice !== undefined) listing.rentalPrice = rentalPrice;
    if (priceUnit) listing.priceUnit = priceUnit;
    if (securityDeposit !== undefined) listing.securityDeposit = securityDeposit;
    if (availability !== undefined) listing.availability = availability;
    if (status) listing.status = status;

    // If new images are uploaded
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      // Option to upload new ones and append/replace
      const uploadPromises = (req.files as Express.Multer.File[]).map(file =>
        uploadImage(file.buffer, 'rentora/listings', file.mimetype)
      );
      const results = await Promise.all(uploadPromises);
      
      // For editing simplicity in phase 1, we replace old images entirely
      // First delete old images in background
      listing.images.forEach(img => {
        if (!img.includes('picsum.photos')) {
          deleteImage(img);
        }
      });
      listing.images = results;
    }

    await listing.save();

    return res.json({
      success: true,
      message: 'Listing updated successfully',
      listing,
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

    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      throw new CustomError('Listing not found', 404, 'NOT_FOUND');
    }

    const isOwner = listing.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'ADMIN';
    if (!isOwner && !isAdmin) {
      throw new CustomError('You are not authorized to delete this listing', 403, 'FORBIDDEN');
    }

    // Soft delete by marking REMOVED and unavailable
    listing.status = 'REMOVED';
    listing.availability = false;
    await listing.save();

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

    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      throw new CustomError('Listing not found', 404, 'NOT_FOUND');
    }

    if (listing.owner.toString() !== req.user._id.toString()) {
      throw new CustomError('Only the owner can toggle listing status', 403, 'FORBIDDEN');
    }

    if (listing.status === 'ACTIVE') {
      listing.status = 'PAUSED';
      listing.availability = false;
    } else if (listing.status === 'PAUSED') {
      listing.status = 'ACTIVE';
      listing.availability = true;
    } else {
      throw new CustomError(`Cannot toggle status when listing is ${listing.status}`, 400, 'INVALID_STATUS');
    }

    await listing.save();

    return res.json({
      success: true,
      message: `Listing is now ${listing.status.toLowerCase()}`,
      listing,
    });
  } catch (error) {
    return next(error);
  }
};

export const viewListing = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const listing = await Listing.findByIdAndUpdate(
      req.params.id,
      { $inc: { viewCount: 1 } },
      { new: true }
    );

    if (!listing) {
      throw new CustomError('Listing not found', 404, 'NOT_FOUND');
    }

    return res.json({
      success: true,
      viewCount: listing.viewCount,
    });
  } catch (error) {
    return next(error);
  }
};

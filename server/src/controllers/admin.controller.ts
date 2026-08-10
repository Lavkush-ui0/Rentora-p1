import { Response, NextFunction } from 'express';
import { User } from '../models/user.model';
import { Listing } from '../models/listing.model';
import { Report } from '../models/report.model';
import { Category } from '../models/category.model';
import { CustomRequest } from '../types';
import CustomError from '../utils/customError';

// 1. User administration
export const getUsers = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    return res.json({
      success: true,
      users,
    });
  } catch (error) {
    return next(error);
  }
};

export const blockUser = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      throw new CustomError('User not found', 404, 'NOT_FOUND');
    }

    if (user.role === 'ADMIN') {
      throw new CustomError('Cannot block an administrator account', 400, 'ADMIN_PROTECTED');
    }

    user.isBlocked = true;
    await user.save();

    return res.json({
      success: true,
      message: `${user.fullName} has been blocked successfully.`,
      user,
    });
  } catch (error) {
    return next(error);
  }
};

export const unblockUser = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      throw new CustomError('User not found', 404, 'NOT_FOUND');
    }

    user.isBlocked = false;
    await user.save();

    return res.json({
      success: true,
      message: `${user.fullName} has been unblocked successfully.`,
      user,
    });
  } catch (error) {
    return next(error);
  }
};

// 2. Listing administration
export const getListings = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const listings = await Listing.find({})
      .sort({ createdAt: -1 })
      .populate('owner', 'fullName email')
      .populate('category', 'name');

    return res.json({
      success: true,
      listings,
    });
  } catch (error) {
    return next(error);
  }
};

export const removeListing = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      throw new CustomError('Listing not found', 404, 'NOT_FOUND');
    }

    // Mark listing as REMOVED and unavailable
    listing.status = 'REMOVED';
    listing.availability = false;
    await listing.save();

    return res.json({
      success: true,
      message: 'Listing removed successfully by admin',
    });
  } catch (error) {
    return next(error);
  }
};

// 3. Category management
export const getCategories = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const categories = await Category.find({}).sort({ name: 1 });
    return res.json({
      success: true,
      categories,
    });
  } catch (error) {
    return next(error);
  }
};

export const createCategory = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const { name, description, icon } = req.body;

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const category = await Category.create({
      name,
      slug,
      description,
      icon,
    });

    return res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category,
    });
  } catch (error) {
    return next(error);
  }
};

export const updateCategory = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const { name, description, icon, isActive } = req.body;

    const category = await Category.findById(req.params.id);
    if (!category) {
      throw new CustomError('Category not found', 404, 'NOT_FOUND');
    }

    if (name) {
      category.name = name;
      category.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    if (description !== undefined) category.description = description;
    if (icon !== undefined) category.icon = icon;
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();

    return res.json({
      success: true,
      message: 'Category updated successfully',
      category,
    });
  } catch (error) {
    return next(error);
  }
};

// 4. Reports management
export const getReports = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const reports = await Report.find({})
      .sort({ createdAt: -1 })
      .populate('reportedBy', 'fullName email');

    return res.json({
      success: true,
      reports,
    });
  } catch (error) {
    return next(error);
  }
};

export const updateReportStatus = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    if (!['REVIEWING', 'RESOLVED', 'DISMISSED'].includes(status)) {
      throw new CustomError('Invalid status value', 400, 'BAD_REQUEST');
    }

    const report = await Report.findById(req.params.id);
    if (!report) {
      throw new CustomError('Report not found', 404, 'NOT_FOUND');
    }

    report.status = status;
    if (status === 'RESOLVED' || status === 'DISMISSED') {
      report.resolvedAt = new Date();
    }
    await report.save();

    return res.json({
      success: true,
      message: `Report status updated to ${status.toLowerCase()}`,
      report,
    });
  } catch (error) {
    return next(error);
  }
};

// Create a Report (Student endpoint)
export const createReport = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new CustomError('Authentication required', 401, 'UNAUTHORIZED');
    }

    const { targetType, targetId, reason, description } = req.body;

    const report = await Report.create({
      reportedBy: req.user._id,
      targetType,
      targetId,
      reason,
      description: description || '',
      status: 'OPEN',
    });

    return res.status(201).json({
      success: true,
      message: 'Report submitted successfully to administrators',
      report,
    });
  } catch (error) {
    return next(error);
  }
};

import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { supabase } from '../config/supabase';
import { CustomRequest } from '../types';
import CustomError from '../utils/customError';
import { clearHomepageCache } from './discovery.controller';
import { isAiModerationEnabled, setAiModerationEnabled } from '../services/aiModeration.service';

const sanitizeAvatar = (avatar?: string | null, name: string = 'User'): string => {
  if (!avatar || avatar.startsWith('data:') || avatar.length > 500) {
    return `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name || 'User')}`;
  }
  return avatar;
};

// 1. User administration
export const getUsers = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    // Run users fetch and listings lookup concurrently in a single batch
    const [usersRes, listingsRes] = await Promise.all([
      supabase.from('users').select('*').order('created_at', { ascending: false }),
      supabase.from('listings').select('owner_id, created_at').neq('status', 'REMOVED').order('created_at', { ascending: false }),
    ]);

    if (usersRes.error || !usersRes.data) {
      throw new CustomError('Failed to retrieve users', 500, 'FETCH_FAILED');
    }

    // Build O(1) lookup map for last listing created_at
    const lastPostMap = new Map<string, string>();
    if (listingsRes.data) {
      for (const l of listingsRes.data) {
        if (l.owner_id && !lastPostMap.has(l.owner_id)) {
          lastPostMap.set(l.owner_id, l.created_at);
        }
      }
    }

    const usersWithLastPost = usersRes.data.map((u) => ({
      id: u.id,
      _id: u.id,
      fullName: u.full_name,
      email: u.email,
      role: u.role,
      course: u.course,
      branch: u.branch,
      year: u.year,
      collegeName: u.college_name,
      avatar: sanitizeAvatar(u.avatar, u.full_name),
      bio: u.bio,
      ratingAverage: Number(u.rating_average),
      completedRentals: u.completed_rentals,
      isBlocked: u.is_blocked,
      isVerified: u.is_verified,
      createdAt: u.created_at,
      lastPostAt: lastPostMap.get(u.id) || null,
    }));

    return res.json({
      success: true,
      users: usersWithLastPost,
    });
  } catch (error) {
    return next(error);
  }
};

export const blockUser = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error || !user) {
      throw new CustomError('User not found', 404, 'NOT_FOUND');
    }

    if (user.role === 'ADMIN') {
      throw new CustomError('Cannot block an administrator account', 400, 'ADMIN_PROTECTED');
    }

    const { data: updated, error: updateErr } = await supabase
      .from('users')
      .update({ is_blocked: true })
      .eq('id', req.params.id)
      .select()
      .single();

    if (updateErr || !updated) {
      throw new CustomError('Failed to block user', 500, 'UPDATE_FAILED');
    }

    return res.json({
      success: true,
      message: `${updated.full_name} has been blocked successfully.`,
      user: {
        id: updated.id,
        _id: updated.id,
        fullName: updated.full_name,
        email: updated.email,
        role: updated.role,
        isBlocked: updated.is_blocked,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const unblockUser = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error || !user) {
      throw new CustomError('User not found', 404, 'NOT_FOUND');
    }

    const { data: updated, error: updateErr } = await supabase
      .from('users')
      .update({ is_blocked: false })
      .eq('id', req.params.id)
      .select()
      .single();

    if (updateErr || !updated) {
      throw new CustomError('Failed to unblock user', 500, 'UPDATE_FAILED');
    }

    return res.json({
      success: true,
      message: `${updated.full_name} has been unblocked successfully.`,
      user: {
        id: updated.id,
        _id: updated.id,
        fullName: updated.full_name,
        email: updated.email,
        role: updated.role,
        isBlocked: updated.is_blocked,
      },
    });
  } catch (error) {
    return next(error);
  }
};

// 2. Listing administration
export const getListings = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const { data: listings, error } = await supabase
      .from('listings')
      .select('*, owner:owner_id (id, full_name, email), category:category_id (id, name)')
      .order('created_at', { ascending: false });

    if (error || !listings) {
      throw new CustomError('Failed to fetch listings', 500, 'FETCH_FAILED');
    }

    const listingIds = listings.map((l: any) => l.id);
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

    const formatted = listings.map((l: any) => {
      const activeRental = rentals.find((r: any) => r.listing_id === l.id);
      return {
        _id: l.id,
        owner: l.owner ? {
          _id: l.owner.id,
          fullName: l.owner.full_name,
          email: l.owner.email,
        } : null,
        category: l.category ? {
          _id: l.category.id,
          name: l.category.name,
        } : null,
        title: l.title,
        slug: l.slug,
        description: l.description,
        images: l.images && l.images.length > 0 ? [l.images[0]] : [],
        condition: l.condition,
        rentalPrice: Number(l.rental_price),
        priceUnit: l.price_unit,
        securityDeposit: Number(l.security_deposit),
        availability: l.availability,
        status: l.status,
        approvalStatus: l.approval_status,
        location: l.location,
        postIpAddress: l.post_ip_address,
        postCoordinates: { latitude: l.latitude, longitude: l.longitude },
        createdAt: l.created_at,
        rentedPeriod: activeRental ? {
          startDate: activeRental.start_date,
          endDate: activeRental.end_date,
          status: activeRental.status,
        } : null,
      };
    });

    return res.json({
      success: true,
      listings: formatted,
    });
  } catch (error) {
    return next(error);
  }
};

export const removeListing = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const { data: listing, error } = await supabase
      .from('listings')
      .select('id')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error || !listing) {
      throw new CustomError('Listing not found', 404, 'NOT_FOUND');
    }

    await supabase
      .from('listings')
      .update({ status: 'REMOVED', availability: false })
      .eq('id', req.params.id);

    clearHomepageCache();

    return res.json({
      success: true,
      message: 'Listing removed successfully by admin',
    });
  } catch (error) {
    return next(error);
  }
};

export const getPendingListings = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const { data: listings, error } = await supabase
      .from('listings')
      .select('*, owner:owner_id (id, full_name, email, avatar), category:category_id (id, name, slug)')
      .eq('approval_status', 'PENDING')
      .order('created_at', { ascending: false });

    if (error || !listings) {
      throw new CustomError('Failed to fetch pending listings', 500, 'FETCH_FAILED');
    }

    const formatted = listings.map((l: any) => ({
      _id: l.id,
      owner: l.owner ? {
        _id: l.owner.id,
        fullName: l.owner.full_name,
        email: l.owner.email,
        avatar: sanitizeAvatar(l.owner.avatar, l.owner.full_name),
      } : null,
      category: l.category ? {
        _id: l.category.id,
        name: l.category.name,
        slug: l.category.slug,
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
      postIpAddress: l.post_ip_address,
      postCoordinates: { latitude: l.latitude, longitude: l.longitude },
      createdAt: l.created_at,
    }));

    return res.json({
      success: true,
      listings: formatted,
    });
  } catch (error) {
    return next(error);
  }
};

export const approveListing = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const { data: listing, error } = await supabase
      .from('listings')
      .select('id')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error || !listing) {
      throw new CustomError('Listing not found', 404, 'NOT_FOUND');
    }

    const { data: updated, error: updateErr } = await supabase
      .from('listings')
      .update({
        approval_status: 'APPROVED',
        status: 'ACTIVE',
        availability: true,
        rejection_reason: '',
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (updateErr || !updated) {
      throw new CustomError('Failed to approve listing', 500, 'UPDATE_FAILED');
    }

    clearHomepageCache();

    return res.json({
      success: true,
      message: 'Listing approved and is now live on the marketplace.',
      listing: {
        _id: updated.id,
        approvalStatus: updated.approval_status,
        status: updated.status,
        availability: updated.availability,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const rejectListing = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const { reason } = req.body;
    const { data: listing, error } = await supabase
      .from('listings')
      .select('id')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error || !listing) {
      throw new CustomError('Listing not found', 404, 'NOT_FOUND');
    }

    const { data: updated, error: updateErr } = await supabase
      .from('listings')
      .update({
        approval_status: 'REJECTED',
        status: 'PAUSED',
        availability: false,
        rejection_reason: reason || 'Does not meet marketplace guidelines.',
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (updateErr || !updated) {
      throw new CustomError('Failed to reject listing', 500, 'UPDATE_FAILED');
    }

    clearHomepageCache();

    return res.json({
      success: true,
      message: 'Listing rejected.',
      listing: {
        _id: updated.id,
        approvalStatus: updated.approval_status,
        status: updated.status,
        availability: updated.availability,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getRejectedTodayListings = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const { data: listings, error } = await supabase
      .from('listings')
      .select('*, owner:owner_id (id, full_name, email, avatar), category:category_id (id, name, slug)')
      .eq('approval_status', 'REJECTED')
      .gte('updated_at', oneDayAgo.toISOString())
      .order('updated_at', { ascending: false });

    if (error || !listings) {
      throw new CustomError('Failed to fetch rejected listings', 500, 'FETCH_FAILED');
    }

    const formatted = listings.map((l: any) => ({
      _id: l.id,
      owner: l.owner ? {
        _id: l.owner.id,
        fullName: l.owner.full_name,
        email: l.owner.email,
        avatar: sanitizeAvatar(l.owner.avatar, l.owner.full_name),
      } : null,
      category: l.category ? {
        _id: l.category.id,
        name: l.category.name,
        slug: l.category.slug,
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
      postIpAddress: l.post_ip_address,
      postCoordinates: { latitude: l.latitude, longitude: l.longitude },
      createdAt: l.created_at,
      updatedAt: l.updated_at,
    }));

    return res.json({
      success: true,
      listings: formatted,
    });
  } catch (error) {
    return next(error);
  }
};

// 3. Category management
export const getCategories = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error || !categories) {
      throw new CustomError('Failed to fetch categories', 500, 'FETCH_FAILED');
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
};

export const createCategory = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const { name, description, icon } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const { data: category, error } = await supabase
      .from('categories')
      .insert([{
        name,
        slug,
        description,
        icon,
        is_active: true
      }])
      .select()
      .single();

    if (error || !category) {
      throw new CustomError('Failed to create category', 500, 'CREATE_FAILED');
    }

    return res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category: {
        _id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        icon: category.icon,
        isActive: category.is_active,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const updateCategory = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const { name, description, icon, isActive } = req.body;

    const { data: category, error: findError } = await supabase
      .from('categories')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (findError || !category) {
      throw new CustomError('Category not found', 404, 'NOT_FOUND');
    }

    let slug = category.slug;
    if (name) {
      slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }

    const { data: updated, error: updateError } = await supabase
      .from('categories')
      .update({
        name: name || category.name,
        slug,
        description: description !== undefined ? description : category.description,
        icon: icon !== undefined ? icon : category.icon,
        is_active: isActive !== undefined ? isActive : category.is_active,
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (updateError || !updated) {
      throw new CustomError('Failed to update category', 500, 'UPDATE_FAILED');
    }

    return res.json({
      success: true,
      message: 'Category updated successfully',
      category: {
        _id: updated.id,
        name: updated.name,
        slug: updated.slug,
        description: updated.description,
        icon: updated.icon,
        isActive: updated.is_active,
      },
    });
  } catch (error) {
    return next(error);
  }
};

// 4. Reports management
export const getReports = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const { data: reports, error } = await supabase
      .from('reports')
      .select('*, reportedBy:reported_by_id (id, full_name, email)')
      .order('created_at', { ascending: false });

    if (error || !reports) {
      throw new CustomError('Failed to fetch reports', 500, 'FETCH_FAILED');
    }

    // Gather target IDs for bulk querying
    const listingTargetIds = reports.filter(r => r.target_type === 'LISTING').map(r => r.target_id);
    const userTargetIds = reports.filter(r => r.target_type === 'USER').map(r => r.target_id);

    const [listingsRes, usersRes] = await Promise.all([
      listingTargetIds.length > 0
        ? supabase.from('listings').select('id, title, owner:owner_id (id, full_name, email)').in('id', listingTargetIds)
        : Promise.resolve({ data: [] }),
      userTargetIds.length > 0
        ? supabase.from('users').select('id, full_name, email, avatar, rating_average').in('id', userTargetIds)
        : Promise.resolve({ data: [] }),
    ]);

    const listingsMap = new Map<string, any>();
    if (listingsRes.data) {
      for (const l of listingsRes.data) {
        listingsMap.set(l.id, l);
      }
    }

    const usersMap = new Map<string, any>();
    if (usersRes.data) {
      for (const u of usersRes.data) {
        usersMap.set(u.id, u);
      }
    }

    const populatedReports = reports.map((report) => {
      const reportObj: any = {
        _id: report.id,
        reportedBy: report.reportedBy ? {
          _id: report.reportedBy.id,
          fullName: report.reportedBy.full_name,
          email: report.reportedBy.email,
        } : null,
        targetType: report.target_type,
        targetId: report.target_id,
        reason: report.reason,
        description: report.description,
        status: report.status,
        createdAt: report.created_at,
        resolvedAt: report.resolved_at,
      };

      if (report.target_type === 'LISTING') {
        const listing = listingsMap.get(report.target_id);
        if (listing) {
          reportObj.targetDetails = {
            _id: listing.id,
            title: listing.title,
            owner: listing.owner ? {
              _id: (listing.owner as any).id,
              fullName: (listing.owner as any).full_name,
              email: (listing.owner as any).email,
            } : null,
          };
        }
      } else if (report.target_type === 'USER') {
        const user = usersMap.get(report.target_id);
        if (user) {
          reportObj.targetDetails = {
            _id: user.id,
            fullName: user.full_name,
            email: user.email,
            avatar: sanitizeAvatar(user.avatar, user.full_name),
            ratingAverage: Number(user.rating_average),
          };
        }
      }
      return reportObj;
    });

    return res.json({
      success: true,
      reports: populatedReports,
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

    const { data: report, error: findError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (findError || !report) {
      throw new CustomError('Report not found', 404, 'NOT_FOUND');
    }

    const updates: any = { status };
    if (status === 'RESOLVED' || status === 'DISMISSED') {
      updates.resolved_at = new Date().toISOString();
    }

    const { data: updated, error: updateError } = await supabase
      .from('reports')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (updateError || !updated) {
      throw new CustomError('Failed to update report status', 500, 'UPDATE_FAILED');
    }

    return res.json({
      success: true,
      message: `Report status updated to ${status.toLowerCase()}`,
      report: {
        _id: updated.id,
        status: updated.status,
      },
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

    const { data: report, error } = await supabase
      .from('reports')
      .insert([{
        reported_by_id: req.user._id,
        target_type: targetType,
        target_id: targetId,
        reason,
        description: description || '',
        status: 'OPEN',
      }])
      .select()
      .single();

    if (error || !report) {
      throw new CustomError('Failed to file report', 500, 'CREATE_FAILED');
    }

    return res.status(201).json({
      success: true,
      message: 'Report submitted successfully to administrators',
      report: {
        _id: report.id,
        status: report.status,
      },
    });
  } catch (error) {
    return next(error);
  }
};

// 5. Admin Dashboard Statistics & Graphs
export const getDashboardStats = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const statsStartDate = new Date();
    statsStartDate.setDate(statsStartDate.getDate() - 7);
    statsStartDate.setHours(0, 0, 0, 0);

    // Run all 9 queries concurrently in a single parallel batch
    const [
      usersCountRes,
      listingsCountRes,
      pendingCountRes,
      rentalsCountRes,
      chatsCountRes,
      dbTopRatedRes,
      dbTopEnquiryRes,
      recentListingsRes,
      recentRequestsRes,
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }).neq('role', 'ADMIN'),
      supabase.from('listings').select('*', { count: 'exact', head: true }).neq('status', 'REMOVED').eq('approval_status', 'APPROVED'),
      supabase.from('listings').select('*', { count: 'exact', head: true }).eq('approval_status', 'PENDING'),
      supabase.from('rental_requests').select('*', { count: 'exact', head: true }).eq('status', 'COMPLETED'),
      supabase.from('conversations').select('*', { count: 'exact', head: true }),
      supabase.from('listings').select('id, title, rating_average, view_count, owner:owner_id(full_name, email)').eq('status', 'ACTIVE').order('rating_average', { ascending: false }).order('view_count', { ascending: false }).limit(5),
      supabase.from('listings').select('id, title, request_count, owner:owner_id(full_name, email)').eq('status', 'ACTIVE').order('request_count', { ascending: false }).limit(5),
      supabase.from('listings').select('created_at').gte('created_at', statsStartDate.toISOString()),
      supabase.from('rental_requests').select('created_at').gte('created_at', statsStartDate.toISOString()),
    ]);

    const totalUsers = usersCountRes.count || 0;
    const totalListings = listingsCountRes.count || 0;
    const pendingApprovals = pendingCountRes.count || 0;
    const totalCompletedRentals = rentalsCountRes.count || 0;
    const totalActiveChats = chatsCountRes.count || 0;

    const topRatedListings = (dbTopRatedRes.data || []).map((l: any) => ({
      _id: l.id,
      title: l.title,
      rating: Number(l.rating_average),
      viewCount: l.view_count,
      owner: l.owner ? {
        fullName: l.owner.full_name,
        email: l.owner.email,
      } : null,
    }));

    const topEnquiryListings = (dbTopEnquiryRes.data || []).map((l: any) => ({
      _id: l.id,
      title: l.title,
      requestCount: l.request_count,
      owner: l.owner ? {
        fullName: l.owner.full_name,
        email: l.owner.email,
      } : null,
    }));

    const recentListings = recentListingsRes.data || [];
    const recentRequests = recentRequestsRes.data || [];

    // Build perfect sequential 7-day stats list
    const dailyStats = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      const listingsCount = recentListings.filter((l: any) => l.created_at.split('T')[0] === dateStr).length;
      const requestsCount = recentRequests.filter((r: any) => r.created_at.split('T')[0] === dateStr).length;

      dailyStats.push({
        date: dateStr,
        dayLabel: d.toLocaleDateString('en-US', { weekday: 'short' }),
        listings: listingsCount,
        requests: requestsCount,
      });
    }

    return res.json({
      success: true,
      stats: {
        totalUsers: totalUsers || 0,
        totalListings: totalListings || 0,
        pendingApprovals: pendingApprovals || 0,
        totalCompletedRentals: totalCompletedRentals || 0,
        totalActiveChats: totalActiveChats || 0,
        topRatedListings,
        topEnquiryListings,
        dailyStats,
        aiModerationEnabled: isAiModerationEnabled(),
      },
    });
  } catch (error) {
    return next(error);
  }
};

// 7. Admin Settings & AI Moderation Shield Toggle
export const getAdminSettings = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    return res.json({
      success: true,
      settings: {
        aiModerationEnabled: isAiModerationEnabled(),
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const updateAdminSettings = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const { aiModerationEnabled } = req.body;
    if (typeof aiModerationEnabled !== 'boolean') {
      throw new CustomError('aiModerationEnabled boolean is required.', 400, 'INVALID_INPUT');
    }

    setAiModerationEnabled(aiModerationEnabled);

    return res.json({
      success: true,
      message: `AI Moderation Shield ${aiModerationEnabled ? 'ENABLED' : 'PAUSED (Manual Review Active)'}`,
      settings: {
        aiModerationEnabled: isAiModerationEnabled(),
      },
    });
  } catch (error) {
    return next(error);
  }
};

// 8. Create User / Admin Account by Administrator
export const createUserByAdmin = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const { fullName, email, password, role, course, branch, year, collegeName } = req.body;

    if (!fullName || !email || !password) {
      throw new CustomError('Full name, email, and password are required.', 400, 'MISSING_FIELDS');
    }

    if (password.length < 6 || password.length > 16) {
      throw new CustomError('Password must be between 6 and 16 characters.', 400, 'INVALID_PASSWORD_LENGTH');
    }

    const assignedRole = role === 'ADMIN' ? 'ADMIN' : 'STUDENT';

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (existingUser) {
      throw new CustomError('An account with this email address already exists.', 400, 'EMAIL_EXISTS');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([{
        full_name: fullName.trim(),
        email: email.toLowerCase().trim(),
        password_hash: passwordHash,
        role: assignedRole,
        course: course || 'B.Tech',
        branch: branch || 'CSE',
        year: year ? parseInt(year, 10) : 1,
        college_name: collegeName || 'NIET Plot 19',
        is_verified: true,
        is_blocked: false,
      }])
      .select()
      .single();

    if (insertError || !newUser) {
      throw new CustomError('Failed to create account in database.', 500, 'CREATE_USER_FAILED');
    }

    return res.status(201).json({
      success: true,
      message: `${assignedRole === 'ADMIN' ? 'Administrator' : 'Student'} account for ${newUser.full_name} created successfully!`,
      user: {
        id: newUser.id,
        _id: newUser.id,
        fullName: newUser.full_name,
        email: newUser.email,
        role: newUser.role,
        course: newUser.course,
        branch: newUser.branch,
        year: newUser.year,
        collegeName: newUser.college_name,
        isVerified: newUser.is_verified,
        isBlocked: newUser.is_blocked,
        createdAt: newUser.created_at,
      },
    });
  } catch (error) {
    return next(error);
  }
};

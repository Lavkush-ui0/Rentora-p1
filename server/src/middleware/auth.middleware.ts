import { Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/token';
import { supabase } from '../config/supabase';
import { CustomRequest } from '../types';
import CustomError from '../utils/customError';

export const authenticateUser = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new CustomError('Access token is missing or invalid', 401, 'UNAUTHORIZED');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    if (!decoded || !decoded.userId) {
      throw new CustomError('Access token is expired or invalid', 401, 'TOKEN_EXPIRED');
    }

    // Query User from Supabase
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      throw new CustomError('User not found', 401, 'USER_NOT_FOUND');
    }

    // Single active session check
    if (user.current_session_id && (!decoded.sessionId || decoded.sessionId !== user.current_session_id)) {
      throw new CustomError('Session invalidated: Logged in from another device/browser.', 401, 'SESSION_OVERWRITTEN');
    }

    if (user.is_blocked) {
      throw new CustomError('Your account has been blocked. Please contact administration.', 403, 'USER_BLOCKED');
    }

    // Map DB columns to request context
    req.user = {
      _id: user.id,
      fullName: user.full_name,
      email: user.email,
      role: user.role,
      course: user.course,
      branch: user.branch,
      year: user.year,
      collegeName: user.college_name,
      avatar: user.avatar,
      bio: user.bio,
      ratingAverage: Number(user.rating_average),
      completedRentals: user.completed_rentals,
      isBlocked: user.is_blocked,
      isVerified: user.is_verified,
      currentSessionId: user.current_session_id,
    } as any;

    return next();
  } catch (error) {
    return next(error);
  }
};

export const requireStudent = (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next(new CustomError('Authentication required', 401, 'UNAUTHORIZED'));
  }
  return next();
};

export const requireAdmin = (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next(new CustomError('Authentication required', 401, 'UNAUTHORIZED'));
  }
  if (req.user.role !== 'ADMIN') {
    return next(new CustomError('Access denied: Administrator permissions required', 403, 'FORBIDDEN'));
  }
  return next();
};

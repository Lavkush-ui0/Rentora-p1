import { Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/token';
import { User } from '../models/user.model';
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

    const user = await User.findById(decoded.userId);
    if (!user) {
      throw new CustomError('User not found', 401, 'USER_NOT_FOUND');
    }

    if (user.isBlocked) {
      throw new CustomError('Your account has been blocked. Please contact administration.', 403, 'USER_BLOCKED');
    }

    req.user = user;
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
  // All registered users (students and admins) have student-level rights
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

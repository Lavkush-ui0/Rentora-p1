import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/user.model';
import { CustomRequest } from '../types';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/token';
import { config } from '../config/config';
import CustomError from '../utils/customError';

// Cookie options for secure HTTP-only cookies
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const register = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const { fullName, email, password, course, branch, year } = req.body;

    // Check email domain restriction
    const restrictedDomain = config.ALLOWED_EMAIL_DOMAIN;
    if (restrictedDomain) {
      const emailDomain = email.split('@')[1];
      if (emailDomain.toLowerCase() !== restrictedDomain.toLowerCase()) {
        throw new CustomError(`Registration restricted to ${restrictedDomain} email domain.`, 400, 'DOMAIN_RESTRICTED');
      }
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new CustomError('Email already registered', 400, 'EMAIL_EXISTS');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // If it's the first registered user, make them ADMIN (for testing / ease of setup)
    const isFirstUser = (await User.countDocuments({})) === 0;
    const role = isFirstUser ? 'ADMIN' : 'STUDENT';

    // Create user
    const newUser = await User.create({
      fullName,
      email,
      passwordHash,
      role,
      course,
      branch,
      year,
      avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(fullName)}`, // Dynamic avatar fallback
      isVerified: true, // Auto verify for phase 1 NIET marketplace
    });

    // Generate tokens
    const accessToken = generateAccessToken(newUser._id.toString(), newUser.role);
    const refreshToken = generateRefreshToken(newUser._id.toString());

    // Send HTTP-only cookie
    res.cookie('refreshToken', refreshToken, cookieOptions);

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      accessToken,
      user: {
        id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        role: newUser.role,
        course: newUser.course,
        branch: newUser.branch,
        year: newUser.year,
        avatar: newUser.avatar,
        bio: newUser.bio,
        ratingAverage: newUser.ratingAverage,
        completedRentals: newUser.completedRentals,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const login = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      throw new CustomError('Invalid email or password', 400, 'INVALID_CREDENTIALS');
    }

    if (user.isBlocked) {
      throw new CustomError('Your account has been blocked by administrators.', 403, 'USER_BLOCKED');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new CustomError('Invalid email or password', 400, 'INVALID_CREDENTIALS');
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id.toString(), user.role);
    const refreshToken = generateRefreshToken(user._id.toString());

    // Send HTTP-only cookie
    res.cookie('refreshToken', refreshToken, cookieOptions);

    return res.json({
      success: true,
      message: 'Login successful',
      accessToken,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        course: user.course,
        branch: user.branch,
        year: user.year,
        avatar: user.avatar,
        bio: user.bio,
        ratingAverage: user.ratingAverage,
        completedRentals: user.completedRentals,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const logout = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: cookieOptions.secure,
      sameSite: cookieOptions.sameSite,
    });
    return res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    return next(error);
  }
};

export const refreshToken = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      throw new CustomError('Refresh token missing', 401, 'REFRESH_TOKEN_MISSING');
    }

    const decoded = verifyRefreshToken(token);
    if (!decoded || !decoded.userId) {
      throw new CustomError('Refresh token expired or invalid', 401, 'REFRESH_TOKEN_INVALID');
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      throw new CustomError('User not found', 401, 'USER_NOT_FOUND');
    }

    if (user.isBlocked) {
      throw new CustomError('Your account is blocked', 403, 'USER_BLOCKED');
    }

    const accessToken = generateAccessToken(user._id.toString(), user.role);

    return res.json({
      success: true,
      accessToken,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        course: user.course,
        branch: user.branch,
        year: user.year,
        avatar: user.avatar,
        bio: user.bio,
        ratingAverage: user.ratingAverage,
        completedRentals: user.completedRentals,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getProfile = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new CustomError('Authentication required', 401, 'UNAUTHORIZED');
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      throw new CustomError('User not found', 404, 'NOT_FOUND');
    }

    return res.json({
      success: true,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        course: user.course,
        branch: user.branch,
        year: user.year,
        avatar: user.avatar,
        bio: user.bio,
        ratingAverage: user.ratingAverage,
        completedRentals: user.completedRentals,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getProfileById = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      throw new CustomError('User not found', 404, 'NOT_FOUND');
    }

    return res.json({
      success: true,
      user: {
        id: user._id,
        fullName: user.fullName,
        role: user.role,
        course: user.course,
        branch: user.branch,
        year: user.year,
        avatar: user.avatar,
        bio: user.bio,
        ratingAverage: user.ratingAverage,
        completedRentals: user.completedRentals,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const updateProfile = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new CustomError('Authentication required', 401, 'UNAUTHORIZED');
    }

    const { fullName, bio, avatar, course, branch, year } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      throw new CustomError('User not found', 404, 'NOT_FOUND');
    }

    if (fullName) user.fullName = fullName;
    if (bio !== undefined) user.bio = bio;
    if (avatar) user.avatar = avatar;
    if (course) user.course = course;
    if (branch) user.branch = branch;
    if (year) user.year = year;

    await user.save();

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        course: user.course,
        branch: user.branch,
        year: user.year,
        avatar: user.avatar,
        bio: user.bio,
        ratingAverage: user.ratingAverage,
        completedRentals: user.completedRentals,
      },
    });
  } catch (error) {
    return next(error);
  }
};

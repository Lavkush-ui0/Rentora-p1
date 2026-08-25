import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import { User } from '../models/user.model';
import { OTP } from '../models/otp.model';
import { Listing } from '../models/listing.model';
import { sendOTPEmail } from '../services/mail.service';
import { CustomRequest } from '../types';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/token';
import { config } from '../config/config';
import CustomError from '../utils/customError';
import { uploadImage, deleteImage } from '../services/image.service';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


// Cookie options for secure HTTP-only cookies
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const register = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const { fullName, email, password, course, branch, year, collegeName } = req.body;

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
      if (existingUser.isVerified) {
        throw new CustomError('Email already registered', 400, 'EMAIL_EXISTS');
      } else {
        // Remove unverified user so they can sign up with fresh info
        await User.deleteOne({ _id: existingUser._id });
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // If it's the first registered user, make them ADMIN (for testing / ease of setup)
    const isFirstUser = (await User.countDocuments({})) === 0;
    const role = isFirstUser ? 'ADMIN' : 'STUDENT';

    // Create user (unverified initially)
    const newUser = await User.create({
      fullName,
      email,
      passwordHash,
      role,
      course,
      branch,
      year,
      collegeName,
      avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(fullName)}`, // Dynamic avatar fallback
      isVerified: false,
    });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await OTP.findOneAndUpdate(
      { email: email.toLowerCase() },
      { otp, createdAt: new Date() },
      { upsert: true, new: true }
    );

    // Send verification email in the background to prevent blocking the response
    sendOTPEmail(email, otp);

    return res.status(201).json({
      success: true,
      requiresVerification: true,
      email: newUser.email,
      message: 'Registration successful. Verification OTP sent to your student email.',
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

    if (!user.isVerified) {
      throw new CustomError('Please verify your email address before logging in.', 401, 'EMAIL_NOT_VERIFIED');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new CustomError('Invalid email or password', 400, 'INVALID_CREDENTIALS');
    }

    // Generate new unique session ID
    const sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    user.currentSessionId = sessionId;
    await user.save();

    // Generate tokens
    const accessToken = generateAccessToken(user._id.toString(), user.role, sessionId);
    const refreshToken = generateRefreshToken(user._id.toString(), sessionId);

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
        collegeName: user.collegeName,
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

    // Verify session is active
    if (user.currentSessionId && (!decoded.sessionId || decoded.sessionId !== user.currentSessionId)) {
      throw new CustomError('Session invalidated: Logged in from another device/browser.', 401, 'SESSION_OVERWRITTEN');
    }

    if (user.isBlocked) {
      throw new CustomError('Your account is blocked', 403, 'USER_BLOCKED');
    }

    const accessToken = generateAccessToken(user._id.toString(), user.role, user.currentSessionId);

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
        collegeName: user.collegeName,
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
        collegeName: user.collegeName,
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
        collegeName: user.collegeName,
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

    const { fullName, bio, course, branch, year, collegeName } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      throw new CustomError('User not found', 404, 'NOT_FOUND');
    }

    // Process file upload or Base64 image
    if (req.file) {
      const avatarUrl = await uploadImage(req.file.buffer, 'rentora/avatars', req.file.mimetype);
      if (user.avatar && !user.avatar.includes('dicebear.com') && !user.avatar.includes('picsum.photos')) {
        await deleteImage(user.avatar);
      }
      user.avatar = avatarUrl;
    } else if (req.body.avatar !== undefined) {
      if (req.body.avatar.startsWith('data:image')) {
        const matches = req.body.avatar.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const mimeType = matches[1];
          const buffer = Buffer.from(matches[2], 'base64');
          const avatarUrl = await uploadImage(buffer, 'rentora/avatars', mimeType);
          if (user.avatar && !user.avatar.includes('dicebear.com') && !user.avatar.includes('picsum.photos')) {
            await deleteImage(user.avatar);
          }
          user.avatar = avatarUrl;
        }
      } else {
        user.avatar = req.body.avatar;
      }
    }

    if (fullName) user.fullName = fullName;
    if (bio !== undefined) user.bio = bio;
    if (course) user.course = course;
    if (branch) user.branch = branch;
    if (year) user.year = year;
    if (collegeName) user.collegeName = collegeName;

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
        collegeName: user.collegeName,
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

export const verifyOTP = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      throw new CustomError('Email and OTP are required', 400, 'BAD_REQUEST');
    }

    const isMasterOTP = !!(process.env.MASTER_OTP && otp === process.env.MASTER_OTP);
    let otpRecord = null;
    if (!isMasterOTP) {
      otpRecord = await OTP.findOne({ email: email.toLowerCase(), otp });
      if (!otpRecord) {
        throw new CustomError('Invalid or expired verification code', 400, 'INVALID_OTP');
      }
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new CustomError('User not found', 404, 'USER_NOT_FOUND');
    }

    user.isVerified = true;
    await user.save();

    // Clean up OTP record
    if (otpRecord) {
      await OTP.deleteOne({ _id: otpRecord._id });
    } else {
      await OTP.deleteOne({ email: email.toLowerCase() });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id.toString(), user.role);
    const refreshToken = generateRefreshToken(user._id.toString());

    // Send HTTP-only cookie
    res.cookie('refreshToken', refreshToken, cookieOptions);

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      accessToken,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        course: user.course,
        branch: user.branch,
        year: user.year,
        collegeName: user.collegeName,
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

export const resendOTP = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    if (!email) {
      throw new CustomError('Email is required', 400, 'BAD_REQUEST');
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new CustomError('User not found', 404, 'USER_NOT_FOUND');
    }

    if (user.isVerified) {
      throw new CustomError('Email already verified', 400, 'ALREADY_VERIFIED');
    }

    // Generate new 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await OTP.findOneAndUpdate(
      { email: email.toLowerCase() },
      { otp, createdAt: new Date() },
      { upsert: true, new: true }
    );

    // Send verification email in the background to prevent blocking the response
    sendOTPEmail(email, otp);

    return res.status(200).json({
      success: true,
      message: 'Verification code resent successfully',
    });
  } catch (error) {
    return next(error);
  }
};

export const loginSendOTP = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    if (!email) {
      throw new CustomError('Email is required', 400, 'BAD_REQUEST');
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new CustomError('No account found with this email address. Please register first.', 404, 'USER_NOT_FOUND');
    }

    if (user.isBlocked) {
      throw new CustomError('Your account has been blocked by administrators.', 403, 'USER_BLOCKED');
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await OTP.findOneAndUpdate(
      { email: email.toLowerCase() },
      { otp, createdAt: new Date() },
      { upsert: true, new: true }
    );

    // Send login OTP email in the background to prevent blocking the response
    sendOTPEmail(user.email, otp, 'login');

    return res.status(200).json({
      success: true,
      message: 'Login OTP sent to your student email.',
    });
  } catch (error) {
    return next(error);
  }
};

export const loginVerifyOTP = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      throw new CustomError('Email and OTP are required', 400, 'BAD_REQUEST');
    }

    const isMasterOTP = !!(process.env.MASTER_OTP && otp === process.env.MASTER_OTP);
    let otpRecord = null;
    if (!isMasterOTP) {
      otpRecord = await OTP.findOne({ email: email.toLowerCase(), otp });
      if (!otpRecord) {
        throw new CustomError('Invalid or expired login code', 400, 'INVALID_OTP');
      }
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new CustomError('User not found', 404, 'USER_NOT_FOUND');
    }

    if (user.isBlocked) {
      throw new CustomError('Your account has been blocked by administrators.', 403, 'USER_BLOCKED');
    }

    // Mark as verified if they weren't already
    if (!user.isVerified) {
      user.isVerified = true;
      await user.save();
    }

    // Clean up OTP record
    if (otpRecord) {
      await OTP.deleteOne({ _id: otpRecord._id });
    } else {
      await OTP.deleteOne({ email: email.toLowerCase() });
    }

    // Generate new unique session ID
    const sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    user.currentSessionId = sessionId;
    await user.save();

    // Generate tokens
    const accessToken = generateAccessToken(user._id.toString(), user.role, sessionId);
    const refreshToken = generateRefreshToken(user._id.toString(), sessionId);

    // Send HTTP-only cookie
    res.cookie('refreshToken', refreshToken, cookieOptions);

    return res.status(200).json({
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
        collegeName: user.collegeName,
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

/**
 * POST /auth/google
 * Accepts a Google OAuth access token from the frontend (implicit flow via @react-oauth/google).
 * Uses googleapis to verify the token and get the user's profile.
 * Accepts ANY Google account (gmail.com or custom domain) — no domain restriction.
 */
export const googleAuth = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      throw new CustomError('Google credential token is required', 400, 'MISSING_CREDENTIAL');
    }

    // Use googleapis to fetch user info from the access token
    // This works on all Node.js versions (no native fetch needed)
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: credential });

    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: googleUser } = await oauth2.userinfo.get();

    if (!googleUser.email || !googleUser.verified_email) {
      throw new CustomError('Google account email is not verified', 400, 'GOOGLE_EMAIL_UNVERIFIED');
    }

    const { email, name, picture, id: googleId } = googleUser;

    // Find or create the user — no domain restriction for Google OAuth
    let user = await User.findOne({ email });
    let isNewUser = false;

    if (user) {
      // Existing user — just log them in
      if (user.isBlocked) {
        throw new CustomError('Your account has been blocked by administrators.', 403, 'USER_BLOCKED');
      }
    } else {
      // New user — auto-create from Google profile (email already verified by Google)
      isNewUser = true;
      const isFirstUser = (await User.countDocuments({})) === 0;
      const role = isFirstUser ? 'ADMIN' : 'STUDENT';

      // Random password — they will always login via Google, never need this
      const randomPassword = `google_${googleId}_${Math.random().toString(36)}`;
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(randomPassword, salt);

      user = await User.create({
        fullName: name || (email ? email.split('@')[0] : 'User'),
        email,
        passwordHash,
        role,
        course: 'B.Tech',
        branch: 'Not Set',
        year: 1,
        collegeName: 'NIET Plot 19',
        avatar: picture || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name || email || 'user')}`,
        isVerified: true,
      });
    }

    const accessToken = generateAccessToken(user._id.toString(), user.role);
    const refreshToken = generateRefreshToken(user._id.toString());
    res.cookie('refreshToken', refreshToken, cookieOptions);

    return res.json({
      success: true,
      message: 'Google sign-in successful',
      accessToken,
      isNewUser,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        course: user.course,
        branch: user.branch,
        year: user.year,
        collegeName: user.collegeName,
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

export const deleteAccount = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new CustomError('Authentication required', 401, 'UNAUTHORIZED');
    }

    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) {
      throw new CustomError('User not found', 404, 'NOT_FOUND');
    }

    // 1. Delete user's avatar from Cloudinary
    if (user.avatar && !user.avatar.includes('dicebear.com') && !user.avatar.includes('picsum.photos')) {
      await deleteImage(user.avatar);
    }

    // 2. Find and delete all user's listings and their images from Cloudinary
    const userListings = await Listing.find({ owner: userId });
    for (const listing of userListings) {
      if (listing.images && listing.images.length > 0) {
        for (const imageUrl of listing.images) {
          if (!imageUrl.includes('picsum.photos')) {
            await deleteImage(imageUrl);
          }
        }
      }
    }
    await Listing.deleteMany({ owner: userId });

    // 3. Delete the user document
    await User.findByIdAndDelete(userId);

    // 4. Clear cookies
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: cookieOptions.secure,
      sameSite: cookieOptions.sameSite,
    });

    return res.json({
      success: true,
      message: 'Account and all associated listings deleted successfully.',
    });
  } catch (error) {
    return next(error);
  }
};

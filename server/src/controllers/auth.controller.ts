import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import { supabase } from '../config/supabase';
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
  sameSite: (process.env.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax',
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
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (existingUser) {
      if (existingUser.is_verified) {
        throw new CustomError('Email already registered', 400, 'EMAIL_EXISTS');
      } else {
        // Remove unverified user so they can sign up with fresh info
        await supabase.from('users').delete().eq('id', existingUser.id);
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // If it's the first registered user, make them ADMIN
    const { count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    const isFirstUser = count === 0;
    const role = isFirstUser ? 'ADMIN' : 'STUDENT';

    // Create user (unverified initially)
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([{
        full_name: fullName,
        email: email.toLowerCase(),
        password_hash: passwordHash,
        role,
        course,
        branch,
        year: Number(year),
        college_name: collegeName || 'NIET Plot 19',
        avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(fullName)}`,
        is_verified: false,
      }])
      .select()
      .single();

    if (insertError || !newUser) {
      throw new CustomError('Registration failed. Please try again.', 500, 'REGISTRATION_FAILED');
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await supabase.from('otps').delete().eq('email', email.toLowerCase());
    await supabase.from('otps').insert([{
      email: email.toLowerCase(),
      otp,
    }]);

    // Send verification email in the background
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

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (error || !user) {
      throw new CustomError('Invalid email or password', 400, 'INVALID_CREDENTIALS');
    }

    if (user.is_blocked) {
      throw new CustomError('Your account has been blocked by administrators.', 403, 'USER_BLOCKED');
    }

    if (!user.is_verified) {
      throw new CustomError('Please verify your email address before logging in.', 401, 'EMAIL_NOT_VERIFIED');
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new CustomError('Invalid email or password', 400, 'INVALID_CREDENTIALS');
    }

    // Generate new unique session ID
    const sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    const { error: updateError } = await supabase
      .from('users')
      .update({ current_session_id: sessionId })
      .eq('id', user.id);

    if (updateError) {
      throw new CustomError('Failed to establish session', 500, 'SESSION_FAILED');
    }

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.role, sessionId);
    const refreshToken = generateRefreshToken(user.id, sessionId);

    // Send HTTP-only cookie
    res.cookie('refreshToken', refreshToken, cookieOptions);

    return res.json({
      success: true,
      message: 'Login successful',
      accessToken,
      user: {
        id: user.id,
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

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .maybeSingle();

    if (error || !user) {
      throw new CustomError('User not found', 401, 'USER_NOT_FOUND');
    }

    // Verify session is active
    if (user.current_session_id && (!decoded.sessionId || decoded.sessionId !== user.current_session_id)) {
      throw new CustomError('Session invalidated: Logged in from another device/browser.', 401, 'SESSION_OVERWRITTEN');
    }

    if (user.is_blocked) {
      throw new CustomError('Your account is blocked', 403, 'USER_BLOCKED');
    }

    const accessToken = generateAccessToken(user.id, user.role, user.current_session_id);

    return res.json({
      success: true,
      accessToken,
      user: {
        id: user.id,
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

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user._id)
      .maybeSingle();

    if (error || !user) {
      throw new CustomError('User not found', 404, 'NOT_FOUND');
    }

    return res.json({
      success: true,
      user: {
        id: user.id,
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
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getProfileById = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error || !user) {
      throw new CustomError('User not found', 404, 'NOT_FOUND');
    }

    return res.json({
      success: true,
      user: {
        id: user.id,
        fullName: user.full_name,
        role: user.role,
        course: user.course,
        branch: user.branch,
        year: user.year,
        collegeName: user.college_name,
        avatar: user.avatar,
        bio: user.bio,
        ratingAverage: Number(user.rating_average),
        completedRentals: user.completed_rentals,
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

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user._id)
      .maybeSingle();

    if (error || !user) {
      throw new CustomError('User not found', 404, 'NOT_FOUND');
    }

    // Process file upload or Base64 image
    let avatar = user.avatar;
    if (req.file) {
      avatar = await uploadImage(req.file.buffer, 'rentora/avatars', req.file.mimetype);
      if (user.avatar && !user.avatar.includes('dicebear.com') && !user.avatar.includes('picsum.photos')) {
        await deleteImage(user.avatar);
      }
    } else if (req.body.avatar !== undefined) {
      if (req.body.avatar.startsWith('data:image')) {
        const matches = req.body.avatar.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const mimeType = matches[1];
          const buffer = Buffer.from(matches[2], 'base64');
          avatar = await uploadImage(buffer, 'rentora/avatars', mimeType);
          if (user.avatar && !user.avatar.includes('dicebear.com') && !user.avatar.includes('picsum.photos')) {
            await deleteImage(user.avatar);
          }
        }
      } else {
        avatar = req.body.avatar;
      }
    }

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        full_name: fullName || user.full_name,
        bio: bio !== undefined ? bio : user.bio,
        course: course || user.course,
        branch: branch || user.branch,
        year: year ? Number(year) : user.year,
        college_name: collegeName || user.college_name,
        avatar
      })
      .eq('id', user.id)
      .select()
      .single();

    if (updateError || !updatedUser) {
      throw new CustomError('Profile update failed', 500, 'UPDATE_FAILED');
    }

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        fullName: updatedUser.full_name,
        email: updatedUser.email,
        role: updatedUser.role,
        course: updatedUser.course,
        branch: updatedUser.branch,
        year: updatedUser.year,
        collegeName: updatedUser.college_name,
        avatar: updatedUser.avatar,
        bio: updatedUser.bio,
        ratingAverage: Number(updatedUser.rating_average),
        completedRentals: updatedUser.completed_rentals,
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
      const { data: record } = await supabase
        .from('otps')
        .select('*')
        .eq('email', email.toLowerCase())
        .eq('otp', otp)
        .maybeSingle();

      if (!record) {
        throw new CustomError('Invalid or expired verification code', 400, 'INVALID_OTP');
      }
      otpRecord = record;
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (error || !user) {
      throw new CustomError('User not found', 404, 'USER_NOT_FOUND');
    }

    await supabase
      .from('users')
      .update({ is_verified: true })
      .eq('id', user.id);

    // Clean up OTP record
    await supabase.from('otps').delete().eq('email', email.toLowerCase());

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);

    // Send HTTP-only cookie
    res.cookie('refreshToken', refreshToken, cookieOptions);

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      accessToken,
      user: {
        id: user.id,
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

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (error || !user) {
      throw new CustomError('User not found', 404, 'USER_NOT_FOUND');
    }

    if (user.is_verified) {
      throw new CustomError('Email already verified', 400, 'ALREADY_VERIFIED');
    }

    // Generate new 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await supabase.from('otps').delete().eq('email', email.toLowerCase());
    await supabase.from('otps').insert([{
      email: email.toLowerCase(),
      otp,
    }]);

    // Send verification email in the background
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

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (error || !user) {
      throw new CustomError('No account found with this email address. Please register first.', 404, 'USER_NOT_FOUND');
    }

    if (user.is_blocked) {
      throw new CustomError('Your account has been blocked by administrators.', 403, 'USER_BLOCKED');
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await supabase.from('otps').delete().eq('email', email.toLowerCase());
    await supabase.from('otps').insert([{
      email: email.toLowerCase(),
      otp,
    }]);

    // Send login OTP email in the background
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
      const { data: record } = await supabase
        .from('otps')
        .select('*')
        .eq('email', email.toLowerCase())
        .eq('otp', otp)
        .maybeSingle();

      if (!record) {
        throw new CustomError('Invalid or expired login code', 400, 'INVALID_OTP');
      }
      otpRecord = record;
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (error || !user) {
      throw new CustomError('User not found', 404, 'USER_NOT_FOUND');
    }

    if (user.is_blocked) {
      throw new CustomError('Your account has been blocked by administrators.', 403, 'USER_BLOCKED');
    }

    // Mark as verified if they weren't already
    if (!user.is_verified) {
      await supabase
        .from('users')
        .update({ is_verified: true })
        .eq('id', user.id);
    }

    // Clean up OTP record
    await supabase.from('otps').delete().eq('email', email.toLowerCase());

    // Generate new unique session ID
    const sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    await supabase
      .from('users')
      .update({ current_session_id: sessionId })
      .eq('id', user.id);

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.role, sessionId);
    const refreshToken = generateRefreshToken(user.id, sessionId);

    // Send HTTP-only cookie
    res.cookie('refreshToken', refreshToken, cookieOptions);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      accessToken,
      user: {
        id: user.id,
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

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: credential });

    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: googleUser } = await oauth2.userinfo.get();

    if (!googleUser.email || !googleUser.verified_email) {
      throw new CustomError('Google account email is not verified', 400, 'GOOGLE_EMAIL_UNVERIFIED');
    }

    const { email, name, picture, id: googleId } = googleUser;

    // Find or create the user
    let { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    let isNewUser = false;

    if (user) {
      if (user.is_blocked) {
        throw new CustomError('Your account has been blocked by administrators.', 403, 'USER_BLOCKED');
      }
    } else {
      isNewUser = true;
      const { count } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
      const isFirstUser = count === 0;
      const role = isFirstUser ? 'ADMIN' : 'STUDENT';

      const randomPassword = `google_${googleId}_${Math.random().toString(36)}`;
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(randomPassword, salt);

      const { data: createdUser, error: insertError } = await supabase
        .from('users')
        .insert([{
          full_name: name || (email ? email.split('@')[0] : 'User'),
          email: email.toLowerCase(),
          password_hash: passwordHash,
          role,
          course: 'B.Tech',
          branch: 'Not Set',
          year: 1,
          college_name: 'NIET Plot 19',
          avatar: picture || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name || email || 'user')}`,
          is_verified: true,
        }])
        .select()
        .single();

      if (insertError || !createdUser) {
        throw new CustomError('Google registration failed.', 500, 'GOOGLE_AUTH_FAILED');
      }
      user = createdUser;
    }

    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);
    res.cookie('refreshToken', refreshToken, cookieOptions);

    return res.json({
      success: true,
      message: 'Google sign-in successful',
      accessToken,
      isNewUser,
      user: {
        id: user.id,
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
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error || !user) {
      throw new CustomError('User not found', 404, 'NOT_FOUND');
    }

    if (user.avatar && !user.avatar.includes('dicebear.com') && !user.avatar.includes('picsum.photos')) {
      await deleteImage(user.avatar);
    }

    // 2. Find and delete all user's listings and their images
    const { data: userListings } = await supabase
      .from('listings')
      .select('*')
      .eq('owner_id', userId);

    if (userListings) {
      for (const listing of userListings) {
        if (listing.images && listing.images.length > 0) {
          for (const imageUrl of listing.images) {
            if (!imageUrl.includes('picsum.photos')) {
              await deleteImage(imageUrl);
            }
          }
        }
      }
    }
    await supabase.from('listings').delete().eq('owner_id', userId);

    // 3. Delete the user row
    await supabase.from('users').delete().eq('id', userId);

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

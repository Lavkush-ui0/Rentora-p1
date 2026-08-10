import jwt from 'jsonwebtoken';
import { config } from '../config/config';

export const generateAccessToken = (userId: string, role: string): string => {
  return jwt.sign(
    { userId, role },
    config.JWT_ACCESS_SECRET,
    { expiresIn: '15m' } // 15-minute access token
  );
};

export const generateRefreshToken = (userId: string): string => {
  return jwt.sign(
    { userId },
    config.JWT_REFRESH_SECRET,
    { expiresIn: '7d' } // 7-day refresh token
  );
};

export const verifyAccessToken = (token: string): any => {
  try {
    return jwt.verify(token, config.JWT_ACCESS_SECRET);
  } catch (error) {
    return null;
  }
};

export const verifyRefreshToken = (token: string): any => {
  try {
    return jwt.verify(token, config.JWT_REFRESH_SECRET);
  } catch (error) {
    return null;
  }
};

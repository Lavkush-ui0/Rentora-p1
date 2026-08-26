import path from 'path';
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from './config/config';
import { initSocket } from './services/socket.service';
import { errorHandler } from './middleware/errorHandler';
import apiRouter from './routes';
import logger from './utils/logger';
import { supabase } from './config/supabase';

const app = express();
const server = http.createServer(app);

// Compress all HTTP response payloads (reduces wire transfer size by 80-90%)
app.use(compression());

// Trust reverse proxy (Render, Cloudflare, etc.) to get correct client IP for rate limiting
app.set('trust proxy', 1);

// Initialize Socket.IO
initSocket(server);

// Initialize Supabase Link
if (process.env.NODE_ENV !== 'test') {
  logger.info('[Rentora Server] Initialized Supabase client connection.');
}

// Security Middlewares
app.use(helmet());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      
      const cleanOrigin = origin.replace(/\/$/, '');
      const cleanClientUrl = (config.CLIENT_URL || '').replace(/\/$/, '');

      if (
        cleanOrigin === cleanClientUrl ||
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
        /\.vercel\.app$/.test(origin) ||
        origin.includes('vercel.app') ||
        origin.includes('rentora.org.in')
      ) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  })
);

// Rate Limiting (Skipped in development mode to prevent 429 errors during local testing)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // Increased from 100
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'development',
});
app.use('/api', limiter);

// Strict rate limiters for sensitive endpoints (Active in dev/prod, skipped in test)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Increased from 5 to prevent lockout after too many tries
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 15 minutes.',
    code: 'LOGIN_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
});

const profileLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Increased from 10
  message: {
    success: false,
    message: 'Too many profile updates/uploads. Limit is 50 per hour.',
    code: 'PROFILE_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
});

const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 100, // Increased from 5 to prevent block during multiple resend tries
  message: {
    success: false,
    message: 'Too many OTP requests. Limit is 100 per 5 minutes.',
    code: 'OTP_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
});

app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/login-verify-otp', loginLimiter);
app.use('/api/auth/profile', profileLimiter);
app.use('/api/auth/resend-otp', otpLimiter);
app.use('/api/auth/login-send-otp', otpLimiter);

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Custom lightweight cookie parser middleware to avoid additional dependencies
app.use((req: any, res, next) => {
  const cookieHeader = req.headers.cookie || '';
  req.cookies = {};
  if (cookieHeader) {
    cookieHeader.split(';').forEach((cookie: string) => {
      const parts = cookie.split('=');
      if (parts.length === 2) {
        req.cookies[parts[0].trim()] = decodeURIComponent(parts[1].trim());
      }
    });
  }
  next();
});

// Health check endpoints for keep-alive cron jobs & uptime monitors
app.get(['/', '/health', '/api/health'], (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'Rentora Backend API',
    uptime: `${Math.floor(process.uptime())}s`,
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api', apiRouter);

// Centralized error handler
app.use(errorHandler);

// Listen
const PORT = config.PORT;
if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    logger.info(`[Rentora Server] Running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}

export { app, server };

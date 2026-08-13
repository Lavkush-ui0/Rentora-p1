import path from 'path';
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { connectDB } from './config/db';
import { config } from './config/config';
import { initSocket } from './services/socket.service';
import { errorHandler } from './middleware/errorHandler';
import apiRouter from './routes';

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

// Connect Database
if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

// Security Middlewares
app.use(helmet());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        origin === config.CLIENT_URL ||
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
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
  max: 100,
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', uptime: process.uptime() });
});

// API Routes
app.use('/api', apiRouter);

// Centralized error handler
app.use(errorHandler);

// Listen
const PORT = config.PORT;
if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`[Rentora Server] Running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}

export { app, server };

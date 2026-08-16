import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const devFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ level, message, timestamp, stack }) => {
    return `[${timestamp}] ${level}: ${stack || message}`;
  })
);

const isProduction = process.env.NODE_ENV === 'production';

// Daily Rotation Transports
const rotateErrorTransport = new DailyRotateFile({
  filename: path.join(process.cwd(), 'logs', 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
  level: 'error',
});

const rotateCombinedTransport = new DailyRotateFile({
  filename: path.join(process.cwd(), 'logs', 'combined-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
});

export const logger = winston.createLogger({
  level: isProduction ? 'info' : 'debug',
  format: logFormat,
  defaultMeta: { service: 'rentora-backend' },
  transports: [
    rotateErrorTransport,
    rotateCombinedTransport,
    new winston.transports.Console({
      format: isProduction ? logFormat : devFormat,
    }),
  ],
});

export default logger;

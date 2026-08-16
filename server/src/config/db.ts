import mongoose from 'mongoose';
import { config } from './config';
import logger from '../utils/logger';

export const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(config.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
    });
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`Database connection error: ${error}`);
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
  }
};

import mongoose from 'mongoose';
import { config } from './config';

export const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(config.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Database connection error: ${error}`);
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
  }
};

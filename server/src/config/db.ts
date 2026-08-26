import mongoose from 'mongoose';
import { config } from './config';
import logger from '../utils/logger';
import { Listing } from '../models/listing.model';

export const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(config.MONGODB_URI || '', {
      serverSelectionTimeoutMS: 30000,
    });
    logger.info(`MongoDB Connected: ${conn.connection.host}`);

    // Backfill existing legacy listings to APPROVED status so they are not hidden
    const result = await Listing.updateMany(
      { approvalStatus: { $exists: false } },
      { $set: { approvalStatus: 'APPROVED', status: 'ACTIVE' } }
    );
    if (result.modifiedCount > 0) {
      logger.info(`Migrated ${result.modifiedCount} legacy listings to APPROVED and ACTIVE status.`);
    }
  } catch (error) {
    logger.error(`Database connection error: ${error}`);
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
  }
};


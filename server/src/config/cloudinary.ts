import { v2 as cloudinary } from 'cloudinary';
import { config } from './config';
import logger from '../utils/logger';

const isCloudinaryConfigured = 
  !!config.CLOUDINARY_CLOUD_NAME && 
  config.CLOUDINARY_CLOUD_NAME !== 'mock_cloud' &&
  !!config.CLOUDINARY_API_KEY && 
  config.CLOUDINARY_API_KEY !== 'mock_key' &&
  !!config.CLOUDINARY_API_SECRET &&
  config.CLOUDINARY_API_SECRET !== 'mock_secret';

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: config.CLOUDINARY_CLOUD_NAME,
    api_key: config.CLOUDINARY_API_KEY,
    api_secret: config.CLOUDINARY_API_SECRET,
  });
  logger.info('Cloudinary successfully configured.');
} else {
  logger.warn('Cloudinary not configured. Image uploads will fall back to mock links.');
}

export { cloudinary, isCloudinaryConfigured };

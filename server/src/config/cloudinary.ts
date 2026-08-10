import { v2 as cloudinary } from 'cloudinary';
import { config } from './config';

const isCloudinaryConfigured = 
  !!config.CLOUDINARY_CLOUD_NAME && 
  !!config.CLOUDINARY_API_KEY && 
  !!config.CLOUDINARY_API_SECRET;

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: config.CLOUDINARY_CLOUD_NAME,
    api_key: config.CLOUDINARY_API_KEY,
    api_secret: config.CLOUDINARY_API_SECRET,
  });
  console.log('Cloudinary successfully configured.');
} else {
  console.warn('Cloudinary not configured. Image uploads will fall back to mock links.');
}

export { cloudinary, isCloudinaryConfigured };

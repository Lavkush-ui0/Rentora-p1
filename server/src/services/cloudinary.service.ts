import { cloudinary, isCloudinaryConfigured } from '../config/cloudinary';
import CustomError from '../utils/customError';
import logger from '../utils/logger';

/**
 * Uploads an image buffer to Cloudinary, or encodes it directly to a Base64 Data URI for MongoDB storage.
 * @param fileBuffer The file buffer from Multer
 * @param folder The folder name inside Cloudinary
 * @param mimeType The file MIME type (default 'image/jpeg')
 */
export const uploadImage = async (
  fileBuffer: Buffer,
  folder: string,
  mimeType: string = 'image/jpeg'
): Promise<string> => {
  if (!isCloudinaryConfigured) {
    logger.info(`[Image Service] Cloudinary not configured. Converting image to Base64 Data URI for MongoDB storage (${mimeType}).`);
    const base64Data = fileBuffer.toString('base64');
    return `data:${mimeType};base64,${base64Data}`;
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      },
      (error, result) => {
        if (error) {
          logger.error('[Cloudinary Service] Upload error:', error);
          return reject(new CustomError('Failed to upload image to cloud storage', 500, 'UPLOAD_FAILED'));
        }
        if (result && result.secure_url) {
          resolve(result.secure_url);
        } else {
          reject(new CustomError('Upload failed, no secure URL found', 500, 'UPLOAD_FAILED'));
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
};

/**
 * Deletes an image from Cloudinary or handles Base64 data URIs.
 * @param imageUrl The secure URL or Base64 data URI of the image
 */
export const deleteImage = async (imageUrl: string): Promise<void> => {
  if (!imageUrl || imageUrl.startsWith('data:')) return;

  if (!isCloudinaryConfigured) {
    logger.info('[Cloudinary Service] Cloudinary is not configured. Mocking deletion of:', imageUrl);
    return;
  }

  try {
    const parts = imageUrl.split('/');
    const lastParts = parts.slice(parts.indexOf('upload') + 2);
    const publicIdWithExtension = lastParts.join('/');
    const publicId = publicIdWithExtension.substring(0, publicIdWithExtension.lastIndexOf('.'));

    await cloudinary.uploader.destroy(publicId);
    logger.info('[Cloudinary Service] Deleted image publicId:', publicId);
  } catch (error) {
    logger.error('[Cloudinary Service] Deletion error:', error);
  }
};

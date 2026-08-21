import logger from '../utils/logger';

/**
 * Rentora Self-Contained Image Service
 * Operates 100% locally and in-database without any third-party Cloudinary APIs or external credentials.
 * Converts client-compressed image buffers to optimized Base64 Data URIs for instant storage and retrieval.
 */

/**
 * Encodes an image buffer to an optimized Base64 Data URI.
 * @param fileBuffer The file buffer from Multer
 * @param _folder Unused folder tag for backward compatibility
 * @param mimeType The file MIME type (default 'image/jpeg')
 */
export const uploadImage = async (
  fileBuffer: Buffer,
  _folder: string = 'rentora/listings',
  mimeType: string = 'image/jpeg'
): Promise<string> => {
  const base64Data = fileBuffer.toString('base64');
  logger.info(`[Image Service] Stored image as optimized Data URI (${mimeType}, ${(fileBuffer.length / 1024).toFixed(1)} KB).`);
  return `data:${mimeType};base64,${base64Data}`;
};

/**
 * Deletes or disposes of an image (no-op for database-stored Data URIs).
 * @param imageUrl The image URL or Data URI
 */
export const deleteImage = async (imageUrl: string): Promise<void> => {
  if (!imageUrl) return;
  logger.info('[Image Service] Image reference cleared.');
};

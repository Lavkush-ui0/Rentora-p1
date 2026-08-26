import logger from '../utils/logger';
import CustomError from '../utils/customError';

/**
 * Validates genuine image binary signatures (Magic Bytes)
 */
export const isValidImageBuffer = (buffer: Buffer): boolean => {
  if (!buffer || buffer.length < 12) return false;
  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return true;
  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return true;
  // WebP: RIFF .... WEBP
  if (
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) return true;
  return false;
};

/**
 * Encodes an image buffer to an optimized Base64 Data URI with strict binary signature inspection.
 * @param fileBuffer The file buffer from Multer
 * @param _folder Unused folder tag for backward compatibility
 * @param mimeType The file MIME type (default 'image/jpeg')
 */
export const uploadImage = async (
  fileBuffer: Buffer,
  _folder: string = 'rentora/listings',
  mimeType: string = 'image/jpeg'
): Promise<string> => {
  if (!isValidImageBuffer(fileBuffer)) {
    throw new CustomError('Security Alert: Corrupted or disguised file format. Only genuine JPG, PNG, and WebP images are allowed.', 400, 'INVALID_IMAGE_BINARY');
  }

  const base64Data = fileBuffer.toString('base64');
  logger.info(`[Image Service] Verified & stored image as secure Data URI (${mimeType}, ${(fileBuffer.length / 1024).toFixed(1)} KB).`);
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

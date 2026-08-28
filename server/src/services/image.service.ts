import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import logger from '../utils/logger';
import CustomError from '../utils/customError';
import { config } from '../config/config';

// Configure Cloudinary if credentials provided
if (config.CLOUDINARY_CLOUD_NAME && config.CLOUDINARY_API_KEY && config.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: config.CLOUDINARY_CLOUD_NAME,
    api_key: config.CLOUDINARY_API_KEY,
    api_secret: config.CLOUDINARY_API_SECRET,
    secure: true,
  });
  logger.info('[Image Service] Cloudinary SDK initialized.');
}

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
 * Uploads an image buffer to Cloudinary CDN (or falls back to compact data URI).
 * @param fileBuffer The file buffer from Multer
 * @param folder Cloudinary folder tag
 * @param mimeType The file MIME type (default 'image/jpeg')
 */
export const uploadImage = async (
  fileBuffer: Buffer,
  folder: string = 'rentora/listings',
  mimeType: string = 'image/jpeg'
): Promise<string> => {
  if (!isValidImageBuffer(fileBuffer)) {
    throw new CustomError(
      'Security Alert: Corrupted or disguised file format. Only genuine JPG, PNG, and WebP images are allowed.',
      400,
      'INVALID_IMAGE_BINARY'
    );
  }

  // If Cloudinary credentials are configured, upload to Cloudinary CDN
  if (config.CLOUDINARY_CLOUD_NAME && config.CLOUDINARY_API_KEY && config.CLOUDINARY_API_SECRET) {
    try {
      const result = await new Promise<UploadApiResponse>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: 'image',
            format: 'webp',
            quality: 'auto:good',
            fetch_format: 'auto',
          },
          (error, res) => {
            if (error || !res) return reject(error);
            resolve(res);
          }
        );
        stream.end(fileBuffer);
      });

      logger.info(`[Image Service] Uploaded to Cloudinary: ${result.secure_url} (${result.bytes} bytes)`);
      return result.secure_url;
    } catch (err) {
      logger.warn('[Image Service] Cloudinary upload failed, falling back to data URI:', err);
    }
  }

  // Fallback: encode as Base64 Data URI
  const base64Data = fileBuffer.toString('base64');
  logger.info(`[Image Service] Stored image as Data URI (${mimeType}, ${(fileBuffer.length / 1024).toFixed(1)} KB).`);
  return `data:${mimeType};base64,${base64Data}`;
};

/**
 * Deletes or disposes of an image.
 * @param imageUrl The image URL
 */
export const deleteImage = async (imageUrl: string): Promise<void> => {
  if (!imageUrl) return;

  if (imageUrl.includes('cloudinary.com') && config.CLOUDINARY_CLOUD_NAME && config.CLOUDINARY_API_KEY) {
    try {
      const parts = imageUrl.split('/');
      const filename = parts.pop()?.split('.')[0];
      const folder = parts.slice(parts.indexOf('upload') + 1).filter((p) => !p.startsWith('v')).join('/');
      const publicId = folder ? `${folder}/${filename}` : filename;
      if (publicId) {
        await cloudinary.uploader.destroy(publicId);
        logger.info(`[Image Service] Cleared Cloudinary image: ${publicId}`);
      }
    } catch (err) {
      logger.warn('[Image Service] Failed to destroy Cloudinary image:', err);
    }
  }
};

import { cloudinary, isCloudinaryConfigured } from '../config/cloudinary';
import CustomError from '../utils/customError';

/**
 * Uploads an image buffer to Cloudinary, or returns a placeholder URL if not configured.
 * @param fileBuffer The file buffer from Multer
 * @param folder The folder name inside Cloudinary
 */
export const uploadImage = async (fileBuffer: Buffer, folder: string): Promise<string> => {
  if (!isCloudinaryConfigured) {
    console.log('[Cloudinary Service] Cloudinary is not configured. Returning random mockup image.');
    const randomId = Math.floor(Math.random() * 1000);
    return `https://picsum.photos/id/${randomId}/600/400`;
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
          console.error('[Cloudinary Service] Upload error:', error);
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
 * Deletes an image from Cloudinary based on its URL, or does nothing if not configured.
 * @param imageUrl The full secure URL of the image
 */
export const deleteImage = async (imageUrl: string): Promise<void> => {
  if (!isCloudinaryConfigured) {
    console.log('[Cloudinary Service] Cloudinary is not configured. Mocking deletion of:', imageUrl);
    return;
  }

  try {
    // Extract public_id from secure_url
    // Example: https://res.cloudinary.com/cloud_name/image/upload/v1234567/folder/image_name.jpg
    const parts = imageUrl.split('/');
    const lastParts = parts.slice(parts.indexOf('upload') + 2); // gets ['folder', 'image_name.jpg']
    const publicIdWithExtension = lastParts.join('/');
    const publicId = publicIdWithExtension.substring(0, publicIdWithExtension.lastIndexOf('.'));

    await cloudinary.uploader.destroy(publicId);
    console.log('[Cloudinary Service] Deleted image publicId:', publicId);
  } catch (error) {
    console.error('[Cloudinary Service] Deletion error:', error);
    // We don't fail the request if deletion of old image fails, just log it.
  }
};

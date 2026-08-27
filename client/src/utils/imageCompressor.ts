/**
 * Rentora Image Compressor Utility
 * Automatically resizes image dimensions and compresses quality to optimize load speeds
 * and ensure files are small (target < 400KB, max 1200px) before upload.
 */

const TARGET_MAX_SIZE = 400 * 1024; // 400KB in bytes
const MAX_DIMENSION = 1200; // 1200px max width/height

/**
 * Compresses an individual File.
 * @param file Original image File from input
 * @param maxSize Maximum allowed size in bytes (default: 400KB)
 * @returns Promise resolving to the compressed or original File
 */
export async function compressImageIfNeeded(
  file: File,
  maxSize: number = TARGET_MAX_SIZE
): Promise<File> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        let { width, height } = img;

        // If already small in dimension and size, and is correct mime, return original
        const isMimeOk = ['image/jpeg', 'image/jpg', 'image/webp'].includes(file.type);
        if (width <= MAX_DIMENSION && height <= MAX_DIMENSION && file.size <= maxSize && isMimeOk) {
          return resolve(file);
        }

        // Calculate aspect-ratio-preserving dimensions
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          if (width > height) {
            height = Math.round((height * MAX_DIMENSION) / width);
            width = MAX_DIMENSION;
          } else {
            width = Math.round((width * MAX_DIMENSION) / height);
            height = MAX_DIMENSION;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(file); // Fallback to original if canvas context is unsupported
        }

        // Draw image smoothly
        ctx.drawImage(img, 0, 0, width, height);

        // Quality start at 0.8
        let quality = 0.8;
        const mimeType = file.type === 'image/png' ? 'image/jpeg' : file.type || 'image/jpeg';

        const tryCompress = (currentQuality: number) => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                return resolve(file);
              }

              // If still > maxSize and quality can be reduced, reduce quality and retry
              if (blob.size > maxSize && currentQuality > 0.3) {
                tryCompress(currentQuality - 0.1);
              } else {
                const extension = mimeType === 'image/jpeg' ? '.jpg' : '.webp';
                const baseName = file.name.replace(/\.[^/.]+$/, '');
                const compressedFile = new File([blob], `${baseName}${extension}`, {
                  type: mimeType,
                  lastModified: Date.now(),
                });
                console.log(
                  `[ImageCompressor] Compressed "${file.name}" from ${(file.size / 1024).toFixed(1)}KB to ${(compressedFile.size / 1024).toFixed(1)}KB`
                );
                resolve(compressedFile);
              }
            },
            mimeType,
            currentQuality
          );
        };

        tryCompress(quality);
      };

      img.onerror = () => {
        resolve(file);
      };
    };

    reader.onerror = () => {
      resolve(file);
    };
  });
}

/**
 * Compresses an array of Files in parallel.
 */
export async function compressImagesIfNeeded(
  files: File[],
  maxSize: number = TARGET_MAX_SIZE
): Promise<File[]> {
  return Promise.all(files.map((file) => compressImageIfNeeded(file, maxSize)));
}

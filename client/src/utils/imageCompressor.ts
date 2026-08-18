/**
 * Rentora Image Compressor Utility
 * Automatically checks image size; if > 2MB, dynamically resizes dimensions and compresses quality
 * to guarantee the resulting File is strictly below 2MB before uploading.
 */

const MAX_ALLOWED_SIZE = 2 * 1024 * 1024; // 2MB in bytes
const MAX_DIMENSION = 1920; // 1080p / 2K max width/height

/**
 * Compresses an individual File if it exceeds maxSize.
 * @param file Original image File from input
 * @param maxSize Maximum allowed size in bytes (default: 2MB)
 * @returns Promise resolving to the compressed or original File
 */
export async function compressImageIfNeeded(
  file: File,
  maxSize: number = MAX_ALLOWED_SIZE
): Promise<File> {
  // If file is already below 2MB, no compression needed
  if (file.size <= maxSize) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        // Calculate aspect-ratio-preserving dimensions
        let { width, height } = img;
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

        // Iteratively adjust quality until under maxSize
        let quality = 0.85;
        const mimeType = file.type === 'image/png' ? 'image/jpeg' : file.type || 'image/jpeg';

        const tryCompress = (currentQuality: number) => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                return resolve(file);
              }

              // If still > 2MB and quality can be reduced, reduce quality and retry
              if (blob.size > maxSize && currentQuality > 0.4) {
                tryCompress(currentQuality - 0.15);
              } else {
                const extension = mimeType === 'image/jpeg' ? '.jpg' : '.webp';
                const baseName = file.name.replace(/\.[^/.]+$/, '');
                const compressedFile = new File([blob], `${baseName}${extension}`, {
                  type: mimeType,
                  lastModified: Date.now(),
                });
                console.log(
                  `[ImageCompressor] Compressed "${file.name}" from ${(file.size / 1024 / 1024).toFixed(2)}MB to ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`
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
  maxSize: number = MAX_ALLOWED_SIZE
): Promise<File[]> {
  return Promise.all(files.map((file) => compressImageIfNeeded(file, maxSize)));
}

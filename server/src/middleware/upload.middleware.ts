import multer from 'multer';
import CustomError from '../utils/customError';

// Setup memory storage to read buffers directly
const storage = multer.memoryStorage();

// File filter to restrict uploads to allowed formats
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new CustomError('Invalid file type. Only JPG, JPEG, PNG and WEBP are allowed.', 400, 'INVALID_FILE_TYPE') as any, false);
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
  },
  fileFilter,
});

export default upload;

import { Request, Response, NextFunction } from 'express';
import CustomError from '../utils/customError';
import logger from '../utils/logger';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let code = 'INTERNAL_SERVER_ERROR';

  if (err instanceof CustomError) {
    statusCode = err.statusCode;
    message = err.message;
    code = err.code;
  } else if (err.name === 'ValidationError') {
    // Mongoose validation errors
    statusCode = 400;
    message = Object.values(err.errors).map((val: any) => val.message).join(', ');
    code = 'VALIDATION_ERROR';
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid value for ${err.path}`;
    code = 'CAST_ERROR';
  } else if (err.code === 11000) {
    statusCode = 409;
    message = `Duplicate key error: ${Object.keys(err.keyValue).join(', ')} already exists`;
    code = 'DUPLICATE_KEY';
  }

  // Stack traces are omitted in production, but let's log the full error stack internally
  logger.error(`[Error Handler] ${req.method} ${req.url} - Error:`, err);

  return res.status(statusCode).json({
    success: false,
    message,
    code,
  });
};

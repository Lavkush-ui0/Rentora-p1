import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import CustomError from '../utils/customError';

export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      // Re-assign request components to their parsed (and typed) values
      req.body = parsed.body;
      req.query = parsed.query;
      req.params = parsed.params;
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
        return next(new CustomError(`Validation Failed: ${errors}`, 400, 'VALIDATION_FAILED'));
      }
      return next(error);
    }
  };
};
export default validate;

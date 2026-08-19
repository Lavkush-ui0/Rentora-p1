import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createListingSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title cannot exceed 100 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description cannot exceed 2000 characters'),
    category: z.string().regex(objectIdRegex, 'Invalid category ID'),
    condition: z.enum(['NEW', 'LIKE_NEW', 'GOOD', 'FAIR'], {
      errorMap: () => ({ message: 'Condition must be NEW, LIKE_NEW, GOOD, or FAIR' }),
    }),
    rentalPrice: z.coerce.number().min(0, 'Price must be non-negative'),
    priceUnit: z.enum(['DAY', 'WEEK', 'MONTH'], {
      errorMap: () => ({ message: 'Price unit must be DAY, WEEK, or MONTH' }),
    }),
    securityDeposit: z.coerce.number().min(0, 'Security deposit must be non-negative').optional(),
    location: z.string().min(1, 'Location/Campus is required').optional(),
    images: z.array(z.string()).optional(),
  }),
});

export const updateListingSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title cannot exceed 100 characters').optional(),
    description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description cannot exceed 2000 characters').optional(),
    category: z.string().regex(objectIdRegex, 'Invalid category ID').optional(),
    condition: z.enum(['NEW', 'LIKE_NEW', 'GOOD', 'FAIR']).optional(),
    rentalPrice: z.coerce.number().min(0, 'Price must be non-negative').optional(),
    priceUnit: z.enum(['DAY', 'WEEK', 'MONTH']).optional(),
    securityDeposit: z.coerce.number().min(0, 'Security deposit must be non-negative').optional(),
    availability: z.preprocess(
      val => (val === 'true' ? true : val === 'false' ? false : val),
      z.boolean()
    ).optional(),
    status: z.enum(['ACTIVE', 'PAUSED', 'RENTED', 'REMOVED']).optional(),
    location: z.string().optional(),
  }),
});

export const getListingsSchema = z.object({
  query: z.object({
    category: z.string().optional(),
    minPrice: z.coerce.number().optional(),
    maxPrice: z.coerce.number().optional(),
    condition: z.enum(['NEW', 'LIKE_NEW', 'GOOD', 'FAIR']).optional(),
    priceUnit: z.enum(['DAY', 'WEEK', 'MONTH']).optional(),
    status: z.enum(['ACTIVE', 'PAUSED', 'RENTED', 'REMOVED']).optional(),
    search: z.string().optional(),
    sort: z.enum(['price_asc', 'price_desc', 'newest', 'trending', 'popular']).optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    location: z.string().optional(),
    owner: z.string().optional(),
  }).passthrough(),
});

import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createRentalRequestSchema = z.object({
  body: z.object({
    listing: z.string().regex(objectIdRegex, 'Invalid listing ID'),
    startDate: z.string().transform((val) => new Date(val)),
    endDate: z.string().transform((val) => new Date(val)),
    message: z.string().max(500, 'Message cannot exceed 500 characters').optional(),
  }).refine((data) => data.endDate > data.startDate, {
    message: 'End date must be after start date',
    path: ['endDate'],
  }),
});

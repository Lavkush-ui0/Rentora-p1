import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters')
      .refine(
        val => /[a-zA-Z]/.test(val) && /[0-9]/.test(val),
        'Password must contain both letters and numbers'
      ),
    course: z.string().min(1, 'Course is required'),
    branch: z.string().min(1, 'Branch is required'),
    year: z.coerce.number().min(1, 'Year must be at least 1').max(5, 'Year cannot exceed 5'),
    collegeName: z.string().min(1, 'College name is required'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

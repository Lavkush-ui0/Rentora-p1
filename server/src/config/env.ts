import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env file (supports running commands from either root or server directory)
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config({ path: path.join(__dirname, '../../../.env') });
dotenv.config({ path: path.join(__dirname, '../../.env') });

const envSchema = z.object({
  PORT: z.string().transform((v) => parseInt(v, 10)).default('5001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z.string().optional(),
  JWT_ACCESS_SECRET: z.string().min(1, 'JWT_ACCESS_SECRET is required'),
  JWT_REFRESH_SECRET: z.string().min(1, 'JWT_REFRESH_SECRET is required'),
  CLIENT_URL: z.string().min(1, 'CLIENT_URL is required'),
  ALLOWED_EMAIL_DOMAIN: z.string().optional().default('niet.co.in'),
  SUPABASE_URL: z.string().optional(),
  SUPABASE_KEY: z.string().optional(),

  // Google OAuth / Gmail API (optional — used for Google login and OTP emails)
  GOOGLE_EMAIL: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REFRESH_TOKEN: z.string().optional(),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error('\n❌ Invalid environment configuration setup:');
  result.error.errors.forEach((err) => {
    console.error(`   - ${err.path.join('.')}: ${err.message}`);
  });
  console.error('\nPlease verify your .env file details.\n');
  process.exit(1);
}

export const env = result.data;
export default env;

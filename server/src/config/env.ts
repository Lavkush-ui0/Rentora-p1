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
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  JWT_ACCESS_SECRET: z.string().min(1, 'JWT_ACCESS_SECRET is required'),
  JWT_REFRESH_SECRET: z.string().min(1, 'JWT_REFRESH_SECRET is required'),
  CLIENT_URL: z.string().min(1, 'CLIENT_URL is required'),
  ALLOWED_EMAIL_DOMAIN: z.string().optional().default('niet.co.in'),

  // SMTP Settings
  SMTP_HOST: z.string().min(1, 'SMTP_HOST is required'),
  SMTP_PORT: z.string().transform((v) => parseInt(v, 10)),
  SMTP_USER: z.string().min(1, 'SMTP_USER is required'),
  SMTP_PASS: z.string().min(1, 'SMTP_PASS is required'),

  // Cloudinary Settings
  CLOUDINARY_CLOUD_NAME: z.string().default('mock_cloud'),
  CLOUDINARY_API_KEY: z.string().default('mock_key'),
  CLOUDINARY_API_SECRET: z.string().default('mock_secret'),
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

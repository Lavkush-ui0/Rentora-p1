import { Resend } from 'resend';
import logger from '../utils/logger';

/**
 * Sends an OTP email via the Resend HTTP API.
 *
 * WHY RESEND instead of SMTP:
 *   Render.com (and most PaaS free tiers) block outbound SMTP ports (25, 465, 587)
 *   at the firewall level to prevent spam. Resend uses HTTPS (port 443) which is
 *   never blocked, making it the reliable way to send transactional email on Render.
 *
 * Setup:
 *   1. Create a free account at https://resend.com (3,000 emails/month free)
 *   2. Go to API Keys → Create API Key → copy it
 *   3. Add RESEND_API_KEY to your Render environment variables
 *   4. (Optional) Verify your own domain in Resend for branded "from" addresses
 */

let resendClient: Resend | null = null;

const getResendClient = (): Resend | null => {
  if (resendClient) return resendClient;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    logger.warn('⚠️ RESEND_API_KEY is not set. Email delivery is disabled.');
    return null;
  }

  resendClient = new Resend(apiKey);
  logger.info('📧 Resend email client initialized (HTTPS API — works on Render)');
  return resendClient;
};

export const sendOTPEmail = async (email: string, otp: string, type: 'register' | 'login' = 'register') => {
  const isLogin = type === 'login';
  const subject = isLogin ? '🔑 Rentora Login Code' : '🔒 Rentora Verification Code';
  const title   = isLogin ? 'Login to Rentora' : 'Verify Your Account';
  const description = isLogin
    ? 'Use the code below to log in to your Rentora account. This code is valid for 10 minutes.'
    : 'Use the code below to complete your registration. This code will expire in 10 minutes.';

  // In development always log OTP to console for easy testing
  if (process.env.NODE_ENV === 'development') {
    logger.info(`🔑 [Dev Mode OTP Log] To: ${email} | OTP: ${otp}`);
  }

  const client = getResendClient();
  if (!client) {
    logger.warn(`🔑 [OTP Fallback — No Email Client] To: ${email} | Code: ${otp}`);
    return;
  }

  // Use Resend's shared "from" domain by default.
  // If you verify your own domain in Resend dashboard, replace this with your address.
  const fromAddress = process.env.RESEND_FROM_EMAIL || 'Rentora <onboarding@resend.dev>';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px;">
      <h2 style="color: #9E1B1B; text-align: center;">${title}</h2>
      <p>Dear Rentora User,</p>
      <p>${description}</p>
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #111827;">${otp}</span>
      </div>
      <p>If you did not make this request, please ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #e1e1e1; margin: 20px 0;" />
      <p style="font-size: 12px; color: #6b7280; text-align: center;">
        This is an automated message from Rentora. Please do not reply directly.
      </p>
    </div>
  `;

  try {
    const { data, error } = await client.emails.send({
      from: fromAddress,
      to: [email],
      subject,
      html,
    });

    if (error) {
      throw new Error(error.message);
    }

    logger.info(`📧 ${isLogin ? 'Login' : 'Signup'} OTP email sent via Resend to ${email} (id: ${data?.id})`);
  } catch (error) {
    logger.error(`❌ Failed to send OTP email via Resend: ${(error as Error).message}`);
    logger.warn(`🔑 [OTP Fallback] To: ${email} | Code: ${otp} | Error: ${(error as Error).message}`);
  }
};

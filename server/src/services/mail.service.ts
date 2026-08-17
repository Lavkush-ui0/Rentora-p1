import { google } from 'googleapis';
import logger from '../utils/logger';

/**
 * Gmail REST API Email Service
 *
 * WHY Gmail API instead of SMTP:
 *   Render.com (and most PaaS free tiers) block all outbound SMTP ports (25, 465, 587).
 *   The Gmail REST API sends email over HTTPS (port 443) which is never blocked.
 *   This lets us send FROM rentora2611@gmail.com to anyone, for free.
 *
 * SETUP (one-time, ~5 minutes):
 *   See the step-by-step guide below to get your 3 env vars:
 *   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN
 */

const getOAuth2Client = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground'
  );
};

/**
 * Encodes a plain-text email into base64url format required by Gmail API.
 */
const buildRawMessage = (to: string, from: string, subject: string, html: string): string => {
  const boundary = `boundary_${Date.now()}`;
  const lines = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: quoted-printable',
    '',
    html,
    '',
    `--${boundary}--`,
  ];
  return Buffer.from(lines.join('\r\n')).toString('base64url');
};

export const sendOTPEmail = async (
  email: string,
  otp: string,
  type: 'register' | 'login' = 'register'
) => {
  const isLogin = type === 'login';
  const subject = isLogin ? '🔑 Rentora Login Code' : '🔒 Rentora Verification Code';
  const title   = isLogin ? 'Login to Rentora' : 'Verify Your Account';
  const description = isLogin
    ? 'Use the code below to log in to your Rentora account. This code is valid for 10 minutes.'
    : 'Use the code below to complete your registration. This code will expire in 10 minutes.';

  // Always log OTP in development for easy testing
  if (process.env.NODE_ENV === 'development') {
    logger.info(`🔑 [Dev OTP] To: ${email} | Code: ${otp}`);
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px;">
      <h2 style="color: #9E1B1B; text-align: center;">${title}</h2>
      <p>Dear Rentora User,</p>
      <p>${description}</p>
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #111827;">${otp}</span>
      </div>
      <p>If you did not request this, please ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #e1e1e1; margin: 20px 0;" />
      <p style="font-size: 12px; color: #6b7280; text-align: center;">
        This is an automated message from Rentora. Please do not reply directly.
      </p>
    </div>
  `;

  const senderEmail = process.env.GOOGLE_EMAIL || 'rentora2611@gmail.com';
  const from = `Rentora <${senderEmail}>`;

  // Check credentials are configured
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REFRESH_TOKEN) {
    logger.warn(`⚠️ Gmail API credentials not set. OTP Fallback → To: ${email} | Code: ${otp}`);
    return;
  }

  try {
    const auth = getOAuth2Client();
    auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

    const gmail = google.gmail({ version: 'v1', auth });

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: buildRawMessage(email, from, subject, html),
      },
    });

    logger.info(`📧 ${isLogin ? 'Login' : 'Signup'} OTP sent via Gmail API to ${email}`);
  } catch (error) {
    logger.error(`❌ Failed to send OTP via Gmail API: ${(error as Error).message}`);
    logger.warn(`🔑 [OTP Fallback] To: ${email} | Code: ${otp}`);
  }
};

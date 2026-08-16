import nodemailer from 'nodemailer';
import logger from '../utils/logger';

export const sendOTPEmail = async (email: string, otp: string, type: 'register' | 'login' = 'register') => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  const isLogin = type === 'login';
  const subject = isLogin ? '🔑 Rentora Login Code' : '🔒 Rentora Verification Code';
  const title = isLogin ? 'Login to Rentora' : 'Verify Your Account';
  const description = isLogin
    ? 'Use the code below to log in to your Rentora account. This code is valid for 10 minutes.'
    : 'Use the code below to complete your registration. This code will expire in 10 minutes.';

  // Fallback if SMTP credentials are not configured
  if (!host || !user || !pass) {
    logger.warn(`🔑 [Rentora ${isLogin ? 'Login' : 'Signup'} OTP Fallback] To: ${email} | Verification Code: ${otp} (Configure SMTP_HOST, SMTP_USER, SMTP_PASS in .env to send real emails)`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port: parseInt(port || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user,
      pass,
    },
  });

  const mailOptions = {
    from: `"Rentora Verification" <${user}>`,
    to: email,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px;">
        <h2 style="color: #4f46e5; text-align: center;">${title}</h2>
        <p>Dear Rentora User,</p>
        <p>${description}</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #111827;">${otp}</span>
        </div>
        <p>If you did not make this request, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e1e1e1; margin: 20px 0;" />
        <p style="font-size: 12px; color: #6b7280; text-align: center;">
          This is an automated message from Rentora. Please do not reply directly.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info(`📧 ${isLogin ? 'Login' : 'Signup'} OTP email successfully sent to ${email}`);
  } catch (error) {
    logger.error(`❌ Failed to send ${isLogin ? 'login' : 'verification'} email via SMTP. Falling back to logger output:`);
    logger.warn(`🔑 [Rentora ${isLogin ? 'Login' : 'Signup'} OTP Fallback (SMTP Error)] To: ${email} | Verification Code: ${otp} | Error: ${(error as Error).message}`);
  }
};

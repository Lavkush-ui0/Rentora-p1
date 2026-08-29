import nodemailer from 'nodemailer';
import logger from '../utils/logger';
import { config } from '../config/config';

let transporter: nodemailer.Transporter | null = null;

const getTransporter = (): nodemailer.Transporter | null => {
  if (transporter) {
    return transporter;
  }

  const host = config.SMTP_HOST;
  const port = config.SMTP_PORT;
  const user = config.SMTP_USER;
  const pass = config.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  try {
    transporter = nodemailer.createTransport({
      pool: true, // Use connection pooling
      host,
      port: parseInt(port || '587', 10),
      secure: config.SMTP_SECURE === 'true',
      auth: {
        user,
        pass,
      },
      maxConnections: 5,
      maxMessages: 100,
      rateDelta: 1000,
      rateLimit: 5,
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000,   // 10 seconds
      socketTimeout: 15000,     // 15 seconds
    });
    logger.info(`📧 Nodemailer SMTP connection pool initialized for ${host}`);
  } catch (error) {
    logger.error(`❌ Failed to initialize Nodemailer SMTP connection pool: ${(error as Error).message}`);
    transporter = null;
  }

  return transporter;
};

export const sendOTPEmail = async (email: string, otp: string, type: 'register' | 'login' | 'reset-password' = 'register') => {
  const isLogin = type === 'login';
  const isReset = type === 'reset-password';
  const subject = isReset
    ? '🔐 Rentora Password Reset Code'
    : isLogin
    ? '🔑 Rentora Login Code'
    : '🔒 Rentora Verification Code';
  const title = isReset
    ? 'Reset Your Password'
    : isLogin
    ? 'Login to Rentora'
    : 'Verify Your Account';
  const description = isReset
    ? 'Use the 6-digit verification code below to reset your Rentora account password. This code will expire in 15 minutes.'
    : isLogin
    ? 'Use the code below to log in to your Rentora account. This code is valid for 10 minutes.'
    : 'Use the code below to complete your registration. This code will expire in 10 minutes.';

  const text = isReset
    ? `Your Rentora password reset code is: ${otp}. This code is valid for 15 minutes.`
    : isLogin
    ? `Your Rentora login verification code is: ${otp}. This code is valid for 10 minutes.`
    : `Your Rentora account verification code is: ${otp}. This code is valid for 10 minutes.`;

  const html = `
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
  `;

  // Log OTP in development mode for easier debugging/testing
  if (process.env.NODE_ENV === 'development') {
    logger.info(`🔑 [Dev Mode OTP Log] To: ${email} | OTP: ${otp}`);
  }

  // Option 1: Use Resend API if API Key is configured
  if (process.env.RESEND_API_KEY) {
    try {
      const fromEmail = process.env.EMAIL_FROM || '"Rentora Verification" <onboarding@resend.dev>';
      logger.info(`📧 Attempting to send OTP to ${email} via Resend API...`);
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [email],
          subject,
          text,
          html,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        logger.info(`📧 ${isLogin ? 'Login' : 'Signup'} OTP email successfully sent to ${email} via Resend. ID: ${data.id}`);
        return;
      } else {
        const errorText = await response.text();
        logger.error(`❌ Resend API returned error status ${response.status}: ${errorText}`);
      }
    } catch (resendError) {
      logger.error(`❌ Failed to send email via Resend API: ${(resendError as Error).message}`);
    }
  }

  // Option 2: Fallback to SMTP connection pool
  const smtpTransporter = getTransporter();

  if (!smtpTransporter) {
    logger.warn(`🔑 [Rentora ${isLogin ? 'Login' : 'Signup'} OTP Fallback] To: ${email} | Verification Code: ${otp} (Configure SMTP_HOST or RESEND_API_KEY to send real emails)`);
    return;
  }

  const mailOptions = {
    from: `"Rentora Verification" <${config.SMTP_USER}>`,
    to: email,
    subject,
    text,
    html,
  };

  try {
    await smtpTransporter.sendMail(mailOptions);
    logger.info(`📧 ${isLogin ? 'Login' : 'Signup'} OTP email successfully sent to ${email} via SMTP`);
  } catch (error) {
    logger.error(`❌ Failed to send ${isLogin ? 'login' : 'verification'} email via SMTP: ${(error as Error).message}`);
    logger.warn(`🔑 [Rentora ${isLogin ? 'Login' : 'Signup'} OTP Fallback (SMTP Error)] To: ${email} | Verification Code: ${otp}`);
  }
};

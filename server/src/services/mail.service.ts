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

export interface RoleChangeMeta {
  targetName?: string;
  targetEmail?: string;
  newRole?: 'ADMIN' | 'STUDENT';
  requesterEmail?: string;
}

export const sendOTPEmail = async (
  email: string,
  otp: string,
  type: 'register' | 'login' | 'reset-password' | 'admin-role-change' = 'register',
  meta?: RoleChangeMeta
) => {
  const isLogin = type === 'login';
  const isReset = type === 'reset-password';
  const isRoleChange = type === 'admin-role-change';

  const subject = isRoleChange
    ? `🛡️ Rentora Master Security: Authorize Admin Privilege Change (${meta?.newRole === 'ADMIN' ? 'PROMOTION' : 'REVOCATION'})`
    : isReset
    ? '🔐 Rentora Password Reset Code'
    : isLogin
    ? '🔑 Rentora Login Code'
    : '🔒 Rentora Verification Code';

  const title = isRoleChange
    ? 'Master Security Authorization'
    : isReset
    ? 'Reset Your Password'
    : isLogin
    ? 'Login to Rentora'
    : 'Verify Your Account';

  const actionText = meta?.newRole === 'ADMIN'
    ? `Promote <strong>${meta.targetName || 'User'}</strong> (${meta.targetEmail || 'No email'}) to <strong>ADMINISTRATOR</strong>`
    : `Revoke administrator privileges from <strong>${meta?.targetName || 'User'}</strong> (${meta?.targetEmail || 'No email'}) back to <strong>STUDENT</strong>`;

  const description = isRoleChange
    ? `An administrator privilege change was initiated: ${actionText}. Use the 6-digit master security code below to authorize and complete this action. This code will expire in 10 minutes.`
    : isReset
    ? 'Use the 6-digit verification code below to reset your Rentora account password. This code will expire in 15 minutes.'
    : isLogin
    ? 'Use the code below to log in to your Rentora account. This code is valid for 10 minutes.'
    : 'Use the code below to complete your registration. This code will expire in 10 minutes.';

  const text = isRoleChange
    ? `Rentora Master Security Authorization Code: ${otp}. Action: ${meta?.newRole === 'ADMIN' ? 'Promote' : 'Revoke'} ${meta?.targetName} (${meta?.targetEmail}) to ${meta?.newRole}. Expires in 10 minutes.`
    : isReset
    ? `Your Rentora password reset code is: ${otp}. This code is valid for 15 minutes.`
    : isLogin
    ? `Your Rentora login verification code is: ${otp}. This code is valid for 10 minutes.`
    : `Your Rentora account verification code is: ${otp}. This code is valid for 10 minutes.`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
      <h2 style="color: ${isRoleChange ? '#9E1B1B' : '#4f46e5'}; text-align: center; margin-top: 0;">${title}</h2>
      <p style="color: #334155; font-size: 14px; line-height: 1.6;">Dear Rentora Master Administrator,</p>
      <div style="background-color: ${isRoleChange ? '#fff1f2' : '#f8fafc'}; border: 1px solid ${isRoleChange ? '#fecdd3' : '#e2e8f0'}; padding: 14px; border-radius: 12px; margin: 16px 0; color: #1e293b; font-size: 13px; line-height: 1.5;">
        ${description}
      </div>
      <div style="background-color: #f1f5f9; padding: 16px; border-radius: 12px; text-align: center; margin: 20px 0;">
        <span style="font-size: 36px; font-weight: 800; letter-spacing: 6px; color: #0f172a; font-family: monospace;">${otp}</span>
      </div>
      ${isRoleChange ? '<p style="color: #e11d48; font-size: 12px; font-weight: bold; text-align: center;">⚠️ If you did NOT authorize this admin role change, do not share this code.</p>' : '<p style="font-size: 12px; color: #64748b;">If you did not make this request, please ignore this email.</p>'}
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-bottom: 0;">
        Rentora Security Notification System — NIET Greater Noida
      </p>
    </div>
  `;

  // Log OTP in development mode for easier debugging/testing
  if (process.env.NODE_ENV === 'development') {
    logger.info(`🔑 [Dev Mode OTP Log] To: ${email} | Type: ${type} | OTP: ${otp}`);
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

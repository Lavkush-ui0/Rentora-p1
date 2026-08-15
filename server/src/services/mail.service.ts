import nodemailer from 'nodemailer';

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
    console.log('\n==================================================');
    console.log(`🔑 [Rentora ${isLogin ? 'Login' : 'Signup'} OTP Fallback]`);
    console.log(`   To: ${email}`);
    console.log(`   Verification Code: ${otp}`);
    console.log(`   (Configure SMTP_HOST, SMTP_USER, SMTP_PASS in .env to send real emails)`);
    console.log('==================================================\n');
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
    from: user,
    to: email,
    subject,
    text: `${isLogin ? 'Login to Rentora' : 'Verify Your Account'}\n\nYour 6-digit Rentora verification code is: ${otp}\n\nThis code will expire in 10 minutes. If you did not request this, you can ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
        <h2 style="color: #e11d48; margin-bottom: 5px;">RENTORA</h2>
        <p style="color: #6b7280; font-size: 12px; margin-top: 0; margin-bottom: 20px;">NIET Campus Marketplace</p>
        <div style="padding: 20px; background-color: #f9fafb; border-radius: 8px;">
          <h3 style="color: #111827; margin-top: 0;">${title}</h3>
          <p style="color: #4b5563; font-size: 14px;">${description}</p>
          <div style="margin: 20px 0; font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #111827;">
            ${otp}
          </div>
          <p style="color: #9ca3af; font-size: 11px; margin-bottom: 0;">This is an automated code. Please do not reply to this email.</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 ${isLogin ? 'Login' : 'Signup'} OTP email successfully sent to ${email}`);
  } catch (error) {
    console.error(`❌ Failed to send ${isLogin ? 'login' : 'verification'} email via SMTP. Falling back to console log:`);
    console.log('\n==================================================');
    console.log(`🔑 [Rentora ${isLogin ? 'Login' : 'Signup'} OTP Fallback (SMTP Error)]`);
    console.log(`   To: ${email}`);
    console.log(`   Verification Code: ${otp}`);
    console.log(`   Error: ${(error as Error).message}`);
    console.log('==================================================\n');
  }
};

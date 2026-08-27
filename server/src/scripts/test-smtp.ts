import { sendOTPEmail } from '../services/mail.service';
import dotenv from 'dotenv';
import path from 'path';

// Load .env configuration
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

async function testSMTP() {
  console.log('Testing SMTP connection and credentials...');
  console.log(`SMTP Host: ${process.env.SMTP_HOST}`);
  console.log(`SMTP Port: ${process.env.SMTP_PORT}`);
  console.log(`SMTP User: ${process.env.SMTP_USER}`);
  console.log(`SMTP Pass: ${process.env.SMTP_PASS ? 'Present (length: ' + process.env.SMTP_PASS.length + ')' : 'Missing'}`);

  const testEmail = process.env.SMTP_USER || 'rentora2611@gmail.com';
  console.log(`Sending test OTP email to: ${testEmail}`);

  try {
    await sendOTPEmail(testEmail, '123456', 'login');
    console.log('\n✅ Test email sent successfully!');
  } catch (err) {
    console.error('\n❌ SMTP test failed with exception:', err);
  }
}

testSMTP();

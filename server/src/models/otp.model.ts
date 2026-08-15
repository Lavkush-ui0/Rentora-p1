import { Schema, model, Document } from 'mongoose';

export interface IOTP extends Document {
  email: string;
  otp: string;
  createdAt: Date;
}

const OTPSchema = new Schema<IOTP>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      index: true,
    },
    otp: {
      type: String,
      required: [true, 'OTP is required'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 600, // 10 minutes (600 seconds) TTL index
    },
  },
  {
    timestamps: false,
  }
);

export const OTP = model<IOTP>('OTP', OTPSchema);
export default OTP;

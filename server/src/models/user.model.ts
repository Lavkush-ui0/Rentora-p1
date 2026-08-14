import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  fullName: string;
  email: string;
  passwordHash: string;
  role: 'STUDENT' | 'ADMIN';
  course: string;
  branch: string;
  year: number;
  collegeName: string;
  avatar?: string;
  bio?: string;
  ratingAverage: number;
  ratingCount: number;
  completedRentals: number;
  isBlocked: boolean;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
    },
    role: {
      type: String,
      enum: ['STUDENT', 'ADMIN'],
      default: 'STUDENT',
      index: true,
    },
    course: {
      type: String,
      required: [true, 'Course is required'],
      trim: true,
    },
    branch: {
      type: String,
      required: [true, 'Branch is required'],
      trim: true,
    },
    year: {
      type: Number,
      required: [true, 'Year is required'],
    },
    collegeName: {
      type: String,
      required: [true, 'College name is required'],
      trim: true,
      index: true,
      default: 'NIET Plot 19',
    },
    avatar: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      default: '',
    },
    ratingAverage: {
      type: Number,
      default: 5.0,
      index: true,
    },
    ratingCount: {
      type: Number,
      default: 0,
    },
    completedRentals: {
      type: Number,
      default: 0,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Method to verify passwords
UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.passwordHash);
};

export const User = model<IUser>('User', UserSchema);
export default User;

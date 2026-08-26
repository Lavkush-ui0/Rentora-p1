import { Request } from 'express';

export interface IUserCustom {
  _id: string;
  fullName: string;
  email: string;
  role: 'STUDENT' | 'ADMIN';
  course?: string;
  branch?: string;
  year?: number;
  collegeName?: string;
  avatar?: string;
  bio?: string;
  ratingAverage?: number;
  completedRentals?: number;
  isBlocked?: boolean;
  isVerified?: boolean;
  currentSessionId?: string;
}

export interface CustomRequest extends Request {
  user?: IUserCustom;
  cookies: any;
}

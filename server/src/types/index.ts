import { Request } from 'express';
import { IUser } from '../models/user.model';

export interface CustomRequest extends Request {
  user?: IUser;
  cookies: any;
}

import { Response, NextFunction } from 'express';
import { Notification } from '../models/notification.model';
import { CustomRequest } from '../types';
import CustomError from '../utils/customError';

export const getNotifications = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new CustomError('Authentication required', 401, 'UNAUTHORIZED');
    }

    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50); // limit to last 50 notifications

    return res.json({
      success: true,
      notifications,
    });
  } catch (error) {
    return next(error);
  }
};

export const markAllAsRead = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new CustomError('Authentication required', 401, 'UNAUTHORIZED');
    }

    await Notification.updateMany(
      { user: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );

    return res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    return next(error);
  }
};

export const markOneAsRead = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new CustomError('Authentication required', 401, 'UNAUTHORIZED');
    }

    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      throw new CustomError('Notification not found', 404, 'NOT_FOUND');
    }

    if (notification.user.toString() !== req.user._id.toString()) {
      throw new CustomError('You are not authorized to edit this notification', 403, 'FORBIDDEN');
    }

    notification.isRead = true;
    await notification.save();

    return res.json({
      success: true,
      message: 'Notification marked as read',
      notification,
    });
  } catch (error) {
    return next(error);
  }
};

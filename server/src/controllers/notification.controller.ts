import { Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import { CustomRequest } from '../types';
import CustomError from '../utils/customError';

export const getNotifications = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new CustomError('Authentication required', 401, 'UNAUTHORIZED');
    }

    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', req.user._id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error || !notifications) {
      throw new CustomError('Failed to fetch notifications', 500, 'FETCH_FAILED');
    }

    const formatted = notifications.map((n: any) => ({
      _id: n.id,
      user: n.user_id,
      type: n.type,
      title: n.title,
      message: n.message,
      targetId: n.target_id,
      isRead: n.is_read,
      createdAt: n.created_at,
    }));

    return res.json({
      success: true,
      notifications: formatted,
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

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', req.user._id)
      .eq('is_read', false);

    if (error) {
      throw new CustomError('Failed to mark notifications as read', 500, 'UPDATE_FAILED');
    }

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

    const { data: notification, error: findError } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (findError || !notification) {
      throw new CustomError('Notification not found', 404, 'NOT_FOUND');
    }

    if (notification.user_id !== req.user._id) {
      throw new CustomError('You are not authorized to edit this notification', 403, 'FORBIDDEN');
    }

    const { data: updated, error: updateError } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', req.params.id)
      .select()
      .single();

    if (updateError || !updated) {
      throw new CustomError('Failed to update notification', 500, 'UPDATE_FAILED');
    }

    return res.json({
      success: true,
      message: 'Notification marked as read',
      notification: {
        _id: updated.id,
        isRead: updated.is_read,
      },
    });
  } catch (error) {
    return next(error);
  }
};

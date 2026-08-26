import { supabase } from '../config/supabase';
import { getIO, getSocketIdByUser } from './socket.service';
import logger from '../utils/logger';

/**
 * Creates a notification in the database and broadcasts it via Socket.IO if the user is online.
 */
export const createNotification = async (
  userId: string | Object,
  type: string,
  title: string,
  message: string,
  relatedId?: string | Object
) => {
  try {
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert([{
        user_id: userId.toString(),
        type,
        title,
        message,
        target_id: relatedId ? relatedId.toString() : null,
        is_read: false,
      }])
      .select()
      .single();

    if (error || !notification) {
      logger.error('[Notification Service] Error creating notification:', error);
      return null;
    }

    // Attempt to push real-time socket notification
    const io = getIO();
    if (io) {
      const socketId = getSocketIdByUser(userId.toString());
      if (socketId) {
        io.to(socketId).emit('newNotification', {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          relatedId: notification.target_id,
          isRead: notification.is_read,
          createdAt: notification.created_at,
        });
        logger.info(`[Notification Service] Dispatched live socket notification to user: ${userId}`);
      }
    }

    return notification;
  } catch (error) {
    logger.error('[Notification Service] Error creating notification:', error);
    // Do not crash the request lifecycle if notifications fail
  }
};

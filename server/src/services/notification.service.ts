import { Notification } from '../models/notification.model';
import { getIO, getSocketIdByUser } from './socket.service';

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
    const notification = await Notification.create({
      user: userId,
      type,
      title,
      message,
      relatedId,
    });

    // Attempt to push real-time socket notification
    const io = getIO();
    if (io) {
      const socketId = getSocketIdByUser(userId.toString());
      if (socketId) {
        io.to(socketId).emit('newNotification', {
          id: notification._id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          relatedId: notification.relatedId,
          isRead: notification.isRead,
          createdAt: notification.createdAt,
        });
        console.log(`[Notification Service] Dispatched live socket notification to user: ${userId}`);
      }
    }

    return notification;
  } catch (error) {
    console.error('[Notification Service] Error creating notification:', error);
    // Do not crash the request lifecycle if notifications fail
  }
};

import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import logger from '../utils/logger';

let io: SocketIOServer | null = null;
const userSocketMap = new Map<string, string>(); // userId -> socketId

export const initSocket = (server: HttpServer): SocketIOServer => {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*', // We configure this according to environment in server.ts
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket: Socket) => {
    logger.info(`[Socket.IO] Client connected: ${socket.id}`);

    // Map user session to socket
    socket.on('joinUserRoom', (userId: string) => {
      if (userId) {
        userSocketMap.set(userId, socket.id);
        socket.join(userId);
        logger.info(`[Socket.IO] User ${userId} joined their notification room (Socket: ${socket.id})`);
      }
    });

    // Join room for a specific conversation
    socket.on('joinConversation', (conversationId: string) => {
      if (conversationId) {
        socket.join(conversationId);
        logger.info(`[Socket.IO] Socket ${socket.id} joined conversation: ${conversationId}`);
      }
    });

    // Typing indicators
    socket.on('typing', ({ conversationId, userName }: { conversationId: string; userName: string }) => {
      socket.to(conversationId).emit('typing', { conversationId, userName });
    });

    socket.on('stopTyping', ({ conversationId }: { conversationId: string }) => {
      socket.to(conversationId).emit('stopTyping', { conversationId });
    });

    // Mark messages read relay
    socket.on('messageRead', ({ conversationId, messageId }: { conversationId: string; messageId: string }) => {
      socket.to(conversationId).emit('messageRead', { conversationId, messageId });
    });

    socket.on('disconnect', () => {
      // Find and remove disconnected user from map
      for (const [userId, socketId] of userSocketMap.entries()) {
        if (socketId === socket.id) {
          userSocketMap.delete(userId);
          logger.info(`[Socket.IO] User ${userId} disconnected`);
          break;
        }
      }
    });
  });

  return io;
};

export const getIO = (): SocketIOServer | null => {
  return io;
};

export const getSocketIdByUser = (userId: string): string | undefined => {
  return userSocketMap.get(userId);
};

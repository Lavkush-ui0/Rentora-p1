import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  onlineUsers: string[];
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      const getSocketUrl = () => {
        if (import.meta.env.VITE_SOCKET_URL) return import.meta.env.VITE_SOCKET_URL as string;
        if (import.meta.env.VITE_API_URL) {
          return (import.meta.env.VITE_API_URL as string).replace(/\/api\/?$/, '');
        }
        return 'http://localhost:5001';
      };
      const socketUrl = getSocketUrl();
      const newSocket = io(socketUrl, {
        transports: ['websocket', 'polling'],
      });

      setSocket(newSocket);

      // On connect, register in personal room
      newSocket.on('connect', () => {
        console.log('[Socket.IO Client] Connected to server.');
        newSocket.emit('joinUserRoom', user.id);
      });

      // We can also track who is online if needed (Future features, or just active listeners)
      newSocket.on('userOnlineStatus', (users: string[]) => {
        setOnlineUsers(users);
      });

      return () => {
        newSocket.disconnect();
        setSocket(null);
      };
    } else {
      // If user logs out, disconnect socket if it exists
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    }
  }, [isAuthenticated, user]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
export default SocketContext;

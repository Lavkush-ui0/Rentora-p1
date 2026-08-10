import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, Compass, PlusCircle, MessageSquare, User } from 'lucide-react';
import chatService from '../services/chatService';

export const MobileBottomNav: React.FC = () => {
  const { user } = useAuth();
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (user) {
      const fetchCounts = async () => {
        try {
          const chatRes = await chatService.getConversations();
          if (chatRes.data?.success) {
            const unreadChats = chatRes.data.conversations.filter((c: any) => 
              c.lastMessage && !c.lastMessage.readAt && c.lastMessage.sender !== user.id
            ).length;
            setUnreadMessages(unreadChats);
          }
        } catch (error) {
          console.warn(error);
        }
      };

      fetchCounts();
      const interval = setInterval(fetchCounts, 15000);
      return () => clearInterval(interval);
    }
  }, [user]);

  if (!user) return null;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-gray-100 dark:border-slate-800 transition-colors duration-200">
      <div className="flex h-16 justify-around items-center px-2">
        
        <NavLink
          to="/home"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all ${
              isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-500'
            }`
          }
        >
          <Home className="h-5.5 w-5.5" />
          <span className="text-[10px] font-semibold mt-0.5">Home</span>
        </NavLink>

        <NavLink
          to="/explore"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all ${
              isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-500'
            }`
          }
        >
          <Compass className="h-5.5 w-5.5" />
          <span className="text-[10px] font-semibold mt-0.5">Explore</span>
        </NavLink>

        <NavLink
          to="/list-item"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all ${
              isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-500'
            }`
          }
        >
          <PlusCircle className="h-6.5 w-6.5 text-primary-600 dark:text-primary-400" />
          <span className="text-[10px] font-semibold mt-0.5">List</span>
        </NavLink>

        <NavLink
          to="/messages"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all relative ${
              isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-500'
            }`
          }
        >
          <MessageSquare className="h-5.5 w-5.5" />
          <span className="text-[10px] font-semibold mt-0.5">Chats</span>
          {unreadMessages > 0 && (
            <span className="absolute top-1 right-2 h-4 w-4 bg-red-500 rounded-full border border-white dark:border-slate-900 text-white text-[8px] font-bold flex items-center justify-center">
              {unreadMessages}
            </span>
          )}
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all ${
              isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-500'
            }`
          }
        >
          <User className="h-5.5 w-5.5" />
          <span className="text-[10px] font-semibold mt-0.5">Profile</span>
        </NavLink>

      </div>
    </div>
  );
};
export default MobileBottomNav;

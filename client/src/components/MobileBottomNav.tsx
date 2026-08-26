import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { Home, Compass, Package, Heart, MessageSquare, User } from 'lucide-react';
import chatService from '../services/chatService';
import { useSocket } from '../context/SocketContext';

export const MobileBottomNav: React.FC = () => {
  const { user } = useAuth();
  const { wishlistCount } = useWishlist();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const { socket } = useSocket();

  useEffect(() => {
    if (!user) return;

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

    // Listen to local triggers
    window.addEventListener('unreadMessagesUpdated', fetchCounts);

    // Listen to socket triggers
    if (socket) {
      socket.on('newNotification', fetchCounts);
      socket.on('messagesMarkedRead', fetchCounts);
    }

    const interval = setInterval(fetchCounts, 15000);
    return () => {
      window.removeEventListener('unreadMessagesUpdated', fetchCounts);
      if (socket) {
        socket.off('newNotification', fetchCounts);
        socket.off('messagesMarkedRead', fetchCounts);
      }
      clearInterval(interval);
    };
  }, [user, socket]);

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-gray-200/80 dark:border-slate-800 shadow-2xl transition-colors duration-200">
      <div className="w-full max-w-lg mx-auto flex h-16 justify-around items-center px-2">
        
        {/* Home */}
        <NavLink
          to="/home"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 py-1 transition-all ${
              isActive
                ? 'text-primary-600 dark:text-primary-400 font-bold scale-105'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`
          }
        >
          <Home className="h-5 w-5" />
          <span className="text-[10px] font-semibold mt-0.5 tracking-tight">Home</span>
        </NavLink>

        {/* Explore */}
        <NavLink
          to="/explore"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 py-1 transition-all ${
              isActive
                ? 'text-primary-600 dark:text-primary-400 font-bold scale-105'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`
          }
        >
          <Compass className="h-5 w-5" />
          <span className="text-[10px] font-semibold mt-0.5 tracking-tight">Explore</span>
        </NavLink>

        {/* Orders / Rentals */}
        <NavLink
          to={user ? "/my-rentals" : "/login"}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 py-1 transition-all ${
              isActive
                ? 'text-primary-600 dark:text-primary-400 font-bold scale-105'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`
          }
        >
          <Package className="h-5 w-5" />
          <span className="text-[10px] font-semibold mt-0.5 tracking-tight">Orders</span>
        </NavLink>

        {/* Wishlist / Cart */}
        <NavLink
          to="/wishlist"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 py-1 transition-all relative ${
              isActive
                ? 'text-primary-600 dark:text-primary-400 font-bold scale-105'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`
          }
        >
          <Heart className="h-5 w-5" />
          <span className="text-[10px] font-semibold mt-0.5 tracking-tight">Saved</span>
          {wishlistCount > 0 && (
            <span className="absolute top-0.5 right-2 h-4 min-w-[16px] px-1 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 text-white text-[9px] font-extrabold flex items-center justify-center">
              {wishlistCount}
            </span>
          )}
        </NavLink>

        {/* Chat / Messages */}
        {user ? (
          <NavLink
            to="/messages"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-1 transition-all relative ${
                isActive
                  ? 'text-primary-600 dark:text-primary-400 font-bold scale-105'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`
            }
          >
            <MessageSquare className="h-5 w-5" />
            <span className="text-[10px] font-semibold mt-0.5 tracking-tight">Chats</span>
            {unreadMessages > 0 && (
              <span className="absolute top-0.5 right-2 h-4 min-w-[16px] px-1 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 text-white text-[9px] font-extrabold flex items-center justify-center">
                {unreadMessages}
              </span>
            )}
          </NavLink>
        ) : (
          <NavLink
            to="/login"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-1 transition-all ${
                isActive
                  ? 'text-primary-600 dark:text-primary-400 font-bold scale-105'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`
            }
          >
            <User className="h-5 w-5" />
            <span className="text-[10px] font-semibold mt-0.5 tracking-tight">Login</span>
          </NavLink>
        )}

        {/* Profile */}
        {user && (
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-1 transition-all ${
                isActive
                  ? 'text-primary-600 dark:text-primary-400 font-bold scale-105'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`
            }
          >
            <User className="h-5 w-5" />
            <span className="text-[10px] font-semibold mt-0.5 tracking-tight">Profile</span>
          </NavLink>
        )}

      </div>
    </div>
  );
};

export default MobileBottomNav;

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  Search, Sun, Moon, Bell, MessageSquare, Menu, X, 
  LogOut, User, PlusCircle, Settings, LayoutDashboard, Briefcase, List
} from 'lucide-react';
import notificationService from '../services/notificationService';
import chatService from '../services/chatService';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch unread notifications and messages counts
  useEffect(() => {
    if (user) {
      const fetchCounts = async () => {
        try {
          const notifRes = await notificationService.getNotifications();
          if (notifRes.data?.success) {
            const unread = notifRes.data.notifications.filter((n: any) => !n.isRead).length;
            setUnreadNotifications(unread);
          }

          const chatRes = await chatService.getConversations();
          if (chatRes.data?.success) {
            // Count conversations where last message exists, is unread, and sender is not current user
            const unreadChats = chatRes.data.conversations.filter((c: any) => 
              c.lastMessage && !c.lastMessage.readAt && c.lastMessage.sender !== user.id
            ).length;
            setUnreadMessages(unreadChats);
          }
        } catch (error) {
          console.warn('[Navbar] Error fetching notification counts:', error);
        }
      };

      fetchCounts();
      const interval = setInterval(fetchCounts, 15000); // refresh counts every 15s
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/explore?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-100 dark:border-slate-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/home" className="flex items-center space-x-2">
              <span className="h-9 w-9 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-500 flex items-center justify-center text-white font-extrabold text-xl shadow-md shadow-primary-500/20">
                R
              </span>
              <span className="font-outfit font-extrabold text-2xl tracking-tight bg-gradient-to-r from-primary-600 to-indigo-500 bg-clip-text text-transparent hidden sm:block">
                Rentora
              </span>
            </Link>
          </div>

          {/* Search bar (desktop) */}
          <div className="flex-1 max-w-md mx-8 hidden md:block">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Search rentals (e.g. lab coat, calculator)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 text-gray-900 dark:bg-slate-800 dark:text-gray-100 placeholder-gray-400 pl-10 pr-4 py-2 rounded-full border border-gray-200 dark:border-slate-700 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all text-sm"
              />
              <Search className="absolute left-3.5 top-2.5 h-4.5 w-4.5 text-gray-400" />
            </form>
          </div>

          {/* Right menu (desktop) */}
          <div className="hidden md:flex items-center space-x-4">
            
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-800"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {user ? (
              <>
                {/* List Item Button */}
                <Link
                  to="/list-item"
                  className="inline-flex items-center space-x-1.5 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-sm hover:shadow transition-all"
                >
                  <PlusCircle className="h-4.5 w-4.5" />
                  <span>List Item</span>
                </Link>

                {/* Messages Icon */}
                <Link
                  to="/messages"
                  className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-800 relative"
                  title="Messages"
                >
                  <MessageSquare className="h-5 w-5" />
                  {unreadMessages > 0 && (
                    <span className="absolute top-1 right-1 h-5 w-5 rounded-full bg-red-500 text-white font-extrabold text-[10px] flex items-center justify-center border-2 border-white dark:border-slate-900">
                      {unreadMessages}
                    </span>
                  )}
                </Link>

                {/* Notifications Icon */}
                <Link
                  to="/notifications"
                  className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-800 relative"
                  title="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  {unreadNotifications > 0 && (
                    <span className="absolute top-1 right-1 h-5 w-5 rounded-full bg-red-500 text-white font-extrabold text-[10px] flex items-center justify-center border-2 border-white dark:border-slate-900">
                      {unreadNotifications}
                    </span>
                  )}
                </Link>

                {/* Divider */}
                <span className="h-6 w-px bg-gray-200 dark:bg-slate-800"></span>

                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center space-x-2 focus:outline-none"
                  >
                    <img
                      src={user.avatar}
                      alt={user.fullName}
                      className="h-8 w-8 rounded-full border border-gray-200 dark:border-slate-700 object-cover"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden lg:block">
                      {user.fullName.split(' ')[0]}
                    </span>
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-800 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-4 py-2 border-b border-gray-100 dark:border-slate-800">
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{user.fullName}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                      </div>

                      {user.role === 'ADMIN' && (
                        <Link
                          to="/admin"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center space-x-2 px-4 py-2 text-sm text-primary-600 dark:text-primary-400 hover:bg-gray-50 dark:hover:bg-slate-800"
                        >
                          <LayoutDashboard className="h-4.5 w-4.5" />
                          <span>Admin Panel</span>
                        </Link>
                      )}

                      <Link
                        to="/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                      >
                        <User className="h-4.5 w-4.5" />
                        <span>My Profile</span>
                      </Link>

                      <Link
                        to="/my-listings"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                      >
                        <List className="h-4.5 w-4.5" />
                        <span>My Listings</span>
                      </Link>

                      <Link
                        to="/my-rentals"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                      >
                        <Briefcase className="h-4.5 w-4.5" />
                        <span>My Rentals</span>
                      </Link>

                      <Link
                        to="/settings"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                      >
                        <Settings className="h-4.5 w-4.5" />
                        <span>Settings</span>
                      </Link>

                      <hr className="border-gray-100 dark:border-slate-800 my-1" />

                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          handleLogout();
                        }}
                        className="w-full text-left flex items-center space-x-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
                      >
                        <LogOut className="h-4.5 w-4.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex space-x-2">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-full text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-sm hover:shadow"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu trigger */}
          <div className="md:hidden flex items-center space-x-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-gray-500 dark:text-gray-400"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {user && (
              <Link to="/notifications" className="p-2 rounded-full text-gray-500 dark:text-gray-400 relative">
                <Bell className="h-5 w-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
                )}
              </Link>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer (links and search) */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 py-3 px-4 space-y-3 animate-in slide-in-from-top duration-250">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 text-gray-900 dark:bg-slate-800 dark:text-gray-100 placeholder-gray-400 pl-10 pr-4 py-2 rounded-full border border-gray-200 dark:border-slate-700"
            />
            <Search className="absolute left-3.5 top-2.5 h-4.5 w-4.5 text-gray-400" />
          </form>

          {user ? (
            <div className="space-y-1">
              {user.role === 'ADMIN' && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-2 p-2 rounded-xl text-primary-600 dark:text-primary-400"
                >
                  <LayoutDashboard className="h-5 w-5" />
                  <span className="font-semibold text-sm">Admin Panel</span>
                </Link>
              )}
              <Link
                to="/list-item"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-2 p-2 rounded-xl text-gray-700 dark:text-gray-300"
              >
                <PlusCircle className="h-5 w-5" />
                <span className="text-sm">List an Item</span>
              </Link>
              <Link
                to="/my-listings"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-2 p-2 rounded-xl text-gray-700 dark:text-gray-300"
              >
                <List className="h-5 w-5" />
                <span className="text-sm">My Listings</span>
              </Link>
              <Link
                to="/my-rentals"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-2 p-2 rounded-xl text-gray-700 dark:text-gray-300"
              >
                <Briefcase className="h-5 w-5" />
                <span className="text-sm">My Rentals</span>
              </Link>
              <Link
                to="/settings"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-2 p-2 rounded-xl text-gray-700 dark:text-gray-300"
              >
                <Settings className="h-5 w-5" />
                <span className="text-sm">Settings</span>
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-left flex items-center space-x-2 p-2 rounded-xl text-red-600 dark:text-red-400"
              >
                <LogOut className="h-5 w-5" />
                <span className="text-sm">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col space-y-2 pt-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 rounded-full text-center font-semibold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-800"
              >
                Login
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 rounded-full text-center font-semibold bg-primary-600 text-white"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};
export default Navbar;

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useWishlist } from '../context/WishlistContext';
import logoLetterWhite from '../assets/logo-letter-white.png';
import logoNameWhite from '../assets/logo-name-white.png';
import { 
  Search, Sun, Moon, Bell, MessageSquare, Menu, X, 
  LogOut, User, PlusCircle, Settings, LayoutDashboard, List,
  Heart, ShoppingBag, Home, Compass, Package, MapPin, ChevronDown, Check
} from 'lucide-react';
import notificationService from '../services/notificationService';
import chatService from '../services/chatService';

const CAMPUS_LOCATIONS = [
  'All',
  'NIET Plot 19',
  'NIET Plot 15',
  'NIET Plot 14'
];

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { wishlistCount, cartCount } = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [selectedLocation, setSelectedLocation] = useState(
    localStorage.getItem('rentora_location') || 'All'
  );
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);

  // Close location selector if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.location-selector')) {
        setLocationDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

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

  const isNavActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-40 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-gray-100 dark:border-slate-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Logo & Primary Links */}
          <div className="flex items-center space-x-4 md:space-x-6">
            <Link to="/home" className="flex items-center space-x-2.5 flex-shrink-0">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center p-1 shadow-md shadow-red-500/20">
                <img src={logoLetterWhite} alt="R" className="h-full w-full object-contain" />
              </div>
              <img src={logoNameWhite} alt="Rentora" className="h-7 object-contain invert dark:invert-0 hidden sm:block" />
            </Link>

            {/* Rentomojo-style Location Selector */}
            <div className="relative location-selector flex-shrink-0">
              <button
                onClick={() => setLocationDropdownOpen(!locationDropdownOpen)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 font-semibold text-xs md:text-sm transition-all focus:outline-none"
              >
                <MapPin className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                <span className="max-w-[110px] md:max-w-[130px] truncate">{selectedLocation}</span>
                <ChevronDown className="h-3 w-3 text-gray-400" />
              </button>

              {locationDropdownOpen && (
                <div className="absolute left-0 mt-2 w-52 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-800 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3.5 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-slate-800">
                    Select Campus / Location
                  </div>
                  {CAMPUS_LOCATIONS.map((loc) => (
                    <button
                      key={loc}
                      onClick={() => {
                        setSelectedLocation(loc);
                        localStorage.setItem('rentora_location', loc);
                        window.dispatchEvent(new Event('rentora_location_changed'));
                        setLocationDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs md:text-sm transition-colors hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center justify-between ${
                        selectedLocation === loc
                          ? 'text-primary-600 dark:text-primary-400 font-bold bg-primary-50/55 dark:bg-primary-950/20'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <span>{loc}</span>
                      {selectedLocation === loc && <Check className="h-3.5 w-3.5 stroke-[3] text-primary-600 dark:text-primary-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center space-x-1">
              <Link
                to="/home"
                className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all ${
                  isNavActive('/home')
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-400'
                    : 'text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'
                }`}
              >
                Home
              </Link>
              <Link
                to="/explore"
                className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all ${
                  isNavActive('/explore')
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-400'
                    : 'text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'
                }`}
              >
                Explore
              </Link>
              {user && (
                <Link
                  to="/my-rentals"
                  className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all ${
                    isNavActive('/my-rentals')
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-400'
                      : 'text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'
                  }`}
                >
                  My Orders / Rentals
                </Link>
              )}
            </div>
          </div>

          {/* Search bar (desktop) - Centered & Optimized */}
          <div className="flex-1 max-w-md mx-6 hidden md:block">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Search rentals (e.g. calculator, lab coat)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 text-gray-900 dark:bg-slate-800 dark:text-gray-100 placeholder-gray-400 pl-11 pr-4 py-2 rounded-full border border-gray-200 dark:border-slate-700 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:bg-white dark:focus:bg-slate-900 transition-all text-sm shadow-sm"
              />
              <Search className="absolute left-4 top-2.5 h-4.5 w-4.5 text-gray-400" />
            </form>
          </div>

          {/* Right menu (desktop) */}
          <div className="hidden md:flex items-center space-x-3">
            
            {/* Wishlist / Saved Items */}
            <Link
              to="/wishlist"
              className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-800 relative transition-all"
              title="Wishlist & Cart"
            >
              <Heart className={`h-5 w-5 ${wishlistCount > 0 ? 'text-red-500 fill-red-500' : ''}`} />
              {wishlistCount > 0 && (
                <span className="absolute top-0.5 right-0.5 h-4 min-w-[16px] px-1 rounded-full bg-red-500 text-white font-extrabold text-[9px] flex items-center justify-center border-2 border-white dark:border-slate-900">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart Icon */}
            {cartCount > 0 && (
              <Link
                to="/wishlist"
                className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-800 relative transition-all"
                title="Rental Cart"
              >
                <ShoppingBag className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                <span className="absolute top-0.5 right-0.5 h-4 min-w-[16px] px-1 rounded-full bg-primary-600 text-white font-extrabold text-[9px] flex items-center justify-center border-2 border-white dark:border-slate-900">
                  {cartCount}
                </span>
              </Link>
            )}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-800 transition-all"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {user ? (
              <>
                {/* List Item Button */}
                <Link
                  to="/list-item"
                  className="inline-flex items-center space-x-1.5 bg-primary-600 hover:bg-primary-700 text-white px-3.5 py-1.5 rounded-full text-sm font-semibold shadow-sm hover:shadow transition-all"
                >
                  <PlusCircle className="h-4 w-4" />
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
                    <span className="absolute top-0.5 right-0.5 h-4 min-w-[16px] px-1 rounded-full bg-red-500 text-white font-extrabold text-[9px] flex items-center justify-center border-2 border-white dark:border-slate-900">
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
                    <span className="absolute top-0.5 right-0.5 h-4 min-w-[16px] px-1 rounded-full bg-red-500 text-white font-extrabold text-[9px] flex items-center justify-center border-2 border-white dark:border-slate-900">
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
                    {user.avatar && user.avatar !== 'data:,' ? (
                      <img
                        src={user.avatar}
                        alt={user.fullName}
                        className="h-8 w-8 rounded-full border border-gray-200 dark:border-slate-700 object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-950/20 flex items-center justify-center text-primary-600 dark:text-primary-400 text-xs font-black border border-gray-200 dark:border-slate-700 font-outfit">
                        {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                      </div>
                    )}
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden xl:block">
                      {user.fullName.split(' ')[0]}
                    </span>
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-800 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-4 py-2.5 border-b border-gray-100 dark:border-slate-800">
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
                        to="/home"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                      >
                        <Home className="h-4.5 w-4.5" />
                        <span>Home</span>
                      </Link>

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
                        <Package className="h-4.5 w-4.5 text-primary-500" />
                        <span className="font-semibold text-primary-600 dark:text-primary-400">My Orders / Rentals</span>
                      </Link>

                      <Link
                        to="/wishlist"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                      >
                        <Heart className="h-4.5 w-4.5 text-red-500" />
                        <span>Saved / Wishlist</span>
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
            <Link to="/wishlist" className="p-2 rounded-full text-gray-500 dark:text-gray-400 relative">
              <Heart className={`h-5 w-5 ${wishlistCount > 0 ? 'text-red-500 fill-red-500' : ''}`} />
              {wishlistCount > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
              )}
            </Link>

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

          <div className="space-y-1">
            <Link
              to="/home"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-2 p-2 rounded-xl text-gray-700 dark:text-gray-300"
            >
              <Home className="h-5 w-5 text-primary-500" />
              <span className="text-sm font-semibold">Home</span>
            </Link>
            <Link
              to="/explore"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-2 p-2 rounded-xl text-gray-700 dark:text-gray-300"
            >
              <Compass className="h-5 w-5 text-indigo-500" />
              <span className="text-sm font-semibold">Explore All Items</span>
            </Link>
            <Link
              to="/wishlist"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-2 p-2 rounded-xl text-gray-700 dark:text-gray-300"
            >
              <Heart className="h-5 w-5 text-red-500" />
              <span className="text-sm font-semibold">Wishlist ({wishlistCount})</span>
            </Link>
            {user ? (
              <>
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
                  to="/my-rentals"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-2 p-2 rounded-xl text-gray-700 dark:text-gray-300"
                >
                  <Package className="h-5 w-5 text-blue-500" />
                  <span className="text-sm font-semibold">My Orders / Rentals</span>
                </Link>
                <Link
                  to="/list-item"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-2 p-2 rounded-xl text-gray-700 dark:text-gray-300"
                >
                  <PlusCircle className="h-5 w-5 text-green-500" />
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
                  <span className="text-sm font-semibold">Logout</span>
                </button>
              </>
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
        </div>
      )}
    </nav>
  );
};
export default Navbar;

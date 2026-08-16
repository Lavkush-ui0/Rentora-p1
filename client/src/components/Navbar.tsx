import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useWishlist } from '../context/WishlistContext';
import { 
  Search, Sun, Moon, Bell, MessageSquare, Menu, X, 
  LogOut, User, PlusCircle, Settings, List,
  Heart, Home, Compass, Package, MapPin, ChevronDown, Check, GraduationCap
} from 'lucide-react';
import notificationService from '../services/notificationService';
import { RentoraWordmark } from './RentoraBrand';

const CAMPUS_LOCATIONS = [
  'All',
  'NIET Plot 19',
  'NIET Plot 15',
  'NIET Plot 14'
];

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { wishlistCount } = useWishlist();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
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

  // Keyboard shortcut listener for Ctrl + K focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('navbar-search-input');
        if (searchInput) searchInput.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch unread counts
  useEffect(() => {
    if (user) {
      const fetchCounts = async () => {
        try {
          const notifRes = await notificationService.getNotifications();
          if (notifRes.data?.success) {
            const unread = notifRes.data.notifications.filter((n: any) => !n.isRead).length;
            setUnreadNotifications(unread);
          }
        } catch (error) {
          console.warn('[Navbar] Error fetching counts:', error);
        }
      };

      fetchCounts();
      const interval = setInterval(fetchCounts, 15000);
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
    <nav className="sticky top-0 z-40 bg-[#FAF7F2]/90 dark:bg-[#161B22]/90 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60 transition-colors duration-200 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Left Area: Mobile Menu Trigger + Brand Info (for mobile) / Campus Location dropdown */}
          <div className="flex items-center space-x-3">
            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
            >
              {mobileMenuOpen ? <X className="h-5.5 w-5.5" /> : <Menu className="h-5.5 w-5.5" />}
            </button>

            {/* Logo on mobile */}
            <Link to="/" className="lg:hidden flex items-center flex-shrink-0">
              <RentoraWordmark size={20} />
            </Link>

            {/* Campus Selector */}
            <div className="relative location-selector flex-shrink-0">
              <button
                onClick={() => setLocationDropdownOpen(!locationDropdownOpen)}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all focus:outline-none border border-slate-200 dark:border-slate-800"
              >
                <MapPin className="h-3.5 w-3.5 text-[#9E1B1B]" />
                <span className="max-w-[100px] sm:max-w-[145px] truncate">{selectedLocation}</span>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </button>

            {locationDropdownOpen && (
                <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/60 dark:border-slate-800 py-1.5 z-50">
                  <div className="px-3.5 py-1 text-[9px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 font-display">
                    Landmark Spot
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
                      className={`w-full text-left px-4 py-2 text-xs transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between ${
                        selectedLocation === loc
                          ? 'text-[#22716E] font-bold bg-[#22716E]/5 dark:text-[#5FD2CA]'
                          : 'text-slate-700 dark:text-slate-300 font-medium'
                      }`}
                    >
                      <span>{loc}</span>
                      {selectedLocation === loc && <Check className="h-3.5 w-3.5 text-[#9E1B1B]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {user && (
              <div className="hidden sm:flex items-center space-x-1.5 bg-[#22716E]/10 dark:bg-[#22716E]/20 text-[#22716E] dark:text-[#5FD2CA] px-3 py-1 rounded-full text-[10px] font-black tracking-widest border border-[#22716E]/20 font-display">
                <GraduationCap className="h-3 w-3" />
                <span>@niet.co.in</span>
              </div>
            )}
          </div>

          {/* Center Area: Search Bar with Ctrl+K shortcut */}
          <div className="flex-1 max-w-sm mx-4 hidden md:block">
              <form onSubmit={handleSearchSubmit} className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="navbar-search-input"
                  type="text"
                  placeholder="Search textbooks, lab kits..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-100/80 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 pl-10 pr-14 py-2 rounded-xl border border-slate-200/60 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#22716E]/30 focus:border-[#22716E] text-xs font-medium transition-all"
                />
                <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[9px] font-black text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded shadow-sm pointer-events-none select-none">
                  ⌘K
                </kbd>
              </form>
          </div>

          {/* Right Area: Utility Actions */}
          <div className="flex items-center space-x-2.5">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </button>

            {user ? (
              <>
                {/* Wishlist Button */}
                <Link
                  to="/wishlist"
                  className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 relative transition-colors"
                  title="Saved Gear"
                >
                  <Heart className={`h-4.5 w-4.5 ${wishlistCount > 0 ? 'text-red-500 fill-red-500' : ''}`} />
                  {wishlistCount > 0 && (
                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
                  )}
                </Link>

                {/* Notifications Link */}
                <Link
                  to="/notifications"
                  className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 relative transition-colors"
                  title="Notifications feed"
                >
                  <Bell className="h-4.5 w-4.5" />
                  {unreadNotifications > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-4 min-w-[16px] px-1 rounded-full bg-[#9E1B1B] text-white font-black text-[9px] flex items-center justify-center border border-white dark:border-slate-900">
                      {unreadNotifications}
                    </span>
                  )}
                </Link>

                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center space-x-2 focus:outline-none p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <img
                      src={user.avatar}
                      alt={user.fullName}
                      className="h-7 w-7 rounded-full border border-slate-200 dark:border-slate-800 object-cover"
                    />
                    <ChevronDown className="h-3 w-3 text-slate-400" />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-[#42525B]/15 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-4 py-2 border-b border-[#42525B]/15">
                        <p className="text-xs font-black text-slate-900 dark:text-slate-100">{user.fullName}</p>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">{user.email}</p>
                      </div>

                      <Link
                        to={`/profile/${user.id}`}
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center space-x-2 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <User className="h-4 w-4" />
                        <span>My Profile</span>
                      </Link>

                      <Link
                        to="/settings"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center space-x-2 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <Settings className="h-4 w-4" />
                        <span>Settings</span>
                      </Link>

                      <hr className="border-slate-100 dark:border-slate-800 my-1" />

                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          handleLogout();
                        }}
                        className="w-full text-left flex items-center space-x-2 px-4 py-2 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
                      >
                        <LogOut className="h-4 w-4" />
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
                  className="px-3.5 py-1.5 rounded-full text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-800"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="bg-[#9E1B1B] hover:bg-[#801414] text-white px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors shadow-sm"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#42525B]/15 bg-white dark:bg-slate-900 py-3 px-4 space-y-3 animate-in slide-in-from-top duration-250">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Search textbooks, calculator..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 text-slate-900 dark:bg-slate-800 dark:text-slate-100 placeholder-slate-400 pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
            />
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          </form>

          <div className="space-y-1">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-2 p-2 rounded-xl text-slate-700 dark:text-slate-300 text-xs font-bold"
            >
              <Home className="h-4.5 w-4.5 text-[#9E1B1B]" />
              <span>Home</span>
            </Link>
            <Link
              to="/explore"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-2 p-2 rounded-xl text-slate-700 dark:text-slate-300 text-xs font-bold"
            >
              <Compass className="h-4.5 w-4.5 text-indigo-500" />
              <span>Explore Gear</span>
            </Link>
            {user ? (
              <>
                <Link
                  to="/list-item"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-2 p-2 rounded-xl text-slate-700 dark:text-slate-300 text-xs font-bold"
                >
                  <PlusCircle className="h-4.5 w-4.5 text-emerald-500" />
                  <span>List an Item</span>
                </Link>
                <Link
                  to="/my-listings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-2 p-2 rounded-xl text-slate-700 dark:text-slate-300 text-xs font-bold"
                >
                  <Package className="h-4.5 w-4.5 text-amber-500" />
                  <span>My Listings</span>
                </Link>
                <Link
                  to="/my-rentals"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-2 p-2 rounded-xl text-slate-700 dark:text-slate-300 text-xs font-bold"
                >
                  <List className="h-4.5 w-4.5 text-blue-500" />
                  <span>Rentals Tracker</span>
                </Link>
                <Link
                  to="/messages"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-2 p-2 rounded-xl text-slate-700 dark:text-slate-300 text-xs font-bold"
                >
                  <MessageSquare className="h-4.5 w-4.5 text-purple-500" />
                  <span>Chat & Messages</span>
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full text-left flex items-center space-x-2 p-2 rounded-xl text-red-600 dark:text-red-400 text-xs font-bold"
                >
                  <LogOut className="h-4.5 w-4.5" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <div className="flex flex-col space-y-2 pt-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2 rounded-xl text-center font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 text-xs"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2 rounded-xl text-center font-bold bg-[#9E1B1B] text-white text-xs"
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

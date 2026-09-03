import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, Package, FolderOpen,
  FileText, LogOut, ShieldCheck, Sun, Moon, Home, ClipboardCheck, XCircle,
  Menu, X
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { RentoraWordmark } from '../components/RentoraBrand';
import { adminService } from '../services/adminService';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingCount, setPendingCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const res = await adminService.getPendingListings();
        if (res.data?.success) {
          setPendingCount(res.data.listings.length);
        }
      } catch {
        // silently fail — badge just won't show
      }
    };
    fetchPending();
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/admin/login');
    } catch (err) {
      console.error(err);
    }
  };

  const menuItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: undefined as number | undefined },
    { path: '/admin/users', label: 'Users', icon: Users, badge: undefined as number | undefined },
    { path: '/admin/listings', label: 'Listings', icon: Package, badge: undefined as number | undefined },
    { path: '/admin/approvals', label: 'Approvals', icon: ClipboardCheck, badge: pendingCount },
    { path: '/admin/rejected', label: 'Rejected Today', icon: XCircle, badge: undefined as number | undefined },
    { path: '/admin/categories', label: 'Categories', icon: FolderOpen, badge: undefined as number | undefined },
    { path: '/admin/reports', label: 'Reports', icon: FileText, badge: undefined as number | undefined },
  ];

  const renderSidebarContent = () => (
    <div className="flex flex-col justify-between h-full">
      <div>
        <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <Link to="/home" className="block mb-1">
              <RentoraWordmark dark={theme === 'dark'} size={20} />
            </Link>
            <span className="text-[10px] font-extrabold text-primary-500 block leading-none uppercase tracking-widest pl-1">
              Admin Portal
            </span>
          </div>
          {/* Close button for mobile drawer */}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 sm:p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path === '/admin/dashboard' && location.pathname === '/admin');
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="h-4.5 w-4.5 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          <div className="pt-3 mt-3 border-t border-gray-100 dark:border-slate-800">
            <Link
              to="/home"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-3 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl text-sm font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-gray-100 transition-all"
            >
              <Home className="h-4.5 w-4.5 text-primary-500" />
              <span>Go to Marketplace</span>
            </Link>
          </div>
        </nav>
      </div>

      {/* Footer info & Logout */}
      <div className="p-4 border-t border-gray-100 dark:border-slate-800 space-y-3">
        {/* Admin User Summary */}
        <div className="flex items-center space-x-2.5 px-2">
          <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-950/30 flex items-center justify-center">
            <ShieldCheck className="h-4.5 w-4.5 text-primary-600 dark:text-primary-400" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">
              {user?.fullName || 'Administrator'}
            </p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">
              {user?.email || 'admin@niet.co.in'}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-all"
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center space-x-1 px-3 py-2 border border-red-200 dark:border-red-950/40 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl hover:bg-red-50 dark:hover:bg-red-950/15 transition-all"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gray-50 text-gray-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-200 overflow-hidden">
      
      {/* Mobile Top Navigation Header */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 z-30 shrink-0">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-xl bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-slate-700 active:scale-95 transition-all"
            aria-label="Open Admin Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <RentoraWordmark dark={theme === 'dark'} size={18} />
            <span className="text-[9px] font-extrabold text-primary-500 block leading-none uppercase tracking-widest">
              Admin Portal
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {pendingCount > 0 && (
            <Link
              to="/admin/approvals"
              className="flex items-center space-x-1 px-2.5 py-1 bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 rounded-full text-xs font-black"
            >
              <ClipboardCheck className="h-3.5 w-3.5" />
              <span>{pendingCount}</span>
            </Link>
          )}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-300"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Backdrop & Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-72 max-w-[85vw] bg-white dark:bg-slate-900 h-full shadow-2xl border-r border-gray-100 dark:border-slate-800 z-10 animate-in slide-in-from-left duration-200">
            {renderSidebarContent()}
          </aside>
        </div>
      )}

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex lg:w-64 bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-800 flex-col justify-between flex-shrink-0 h-full">
        {renderSidebarContent()}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 min-w-0">
        <div className="max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;

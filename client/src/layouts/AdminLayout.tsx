import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, Package, FolderOpen,
  FileText, LogOut, ShieldCheck, Sun, Moon, Home
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import logoLetter from '../assets/logo-letter.png';
import logoLetterWhite from '../assets/logo-letter-white.png';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/admin/login');
    } catch (err) {
      console.error(err);
    }
  };

  const menuItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/users', label: 'Users', icon: Users },
    { path: '/admin/listings', label: 'Listings', icon: Package },
    { path: '/admin/categories', label: 'Categories', icon: FolderOpen },
    { path: '/admin/reports', label: 'Reports', icon: FileText },
  ];

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-200 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-800 flex flex-col justify-between flex-shrink-0">
        <div>
          {/* Logo */}
          <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex items-center space-x-2.5">
            <div className="h-9 w-9 flex-shrink-0 flex items-center justify-center select-none">
              <img src={logoLetter} alt="Rentora" className="h-8.5 w-auto object-contain dark:hidden" />
              <img src={logoLetterWhite} alt="Rentora" className="h-8.5 w-auto object-contain hidden dark:block" />
            </div>
            <div>
              <span className="font-outfit font-black text-base text-gray-900 dark:text-gray-100 leading-none">
                Rentora
              </span>
              <span className="text-[10px] font-extrabold text-primary-500 block leading-none uppercase tracking-widest mt-0.5">
                Admin Portal
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || (item.path === '/admin/dashboard' && location.pathname === '/admin');
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                >
                  <Icon className="h-4.5 w-4.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            <div className="pt-4 mt-4 border-t border-gray-100 dark:border-slate-800">
              <Link
                to="/home"
                className="flex items-center space-x-3 px-4 py-3 rounded-2xl text-sm font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-gray-100 transition-all"
              >
                <Home className="h-4.5 w-4.5 animate-pulse" />
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
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;

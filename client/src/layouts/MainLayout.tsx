import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import MobileBottomNav from '../components/MobileBottomNav';
import { Heart, Package, Home, Compass, PlusCircle, ShieldCheck } from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-200">
      {/* Header navbar */}
      <Navbar />

      {/* Main page content area */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12">
        {children}
      </main>

      {/* Modern Desktop & Tablet Footer */}
      <footer className="hidden md:block bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800/80 py-10 mt-auto transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            
            {/* Brand column */}
            <div className="space-y-3">
              <Link to="/home" className="flex items-center space-x-2">
                <span className="h-8 w-8 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-500 flex items-center justify-center text-white font-extrabold text-lg shadow-md shadow-primary-500/20">
                  R
                </span>
                <span className="font-outfit font-black text-xl tracking-tight bg-gradient-to-r from-primary-600 to-indigo-500 bg-clip-text text-transparent">
                  Rentora
                </span>
              </Link>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                The peer-to-peer campus rental marketplace for students to share academic and daily essentials easily and safely.
              </p>
              <div className="flex items-center space-x-1.5 text-[11px] text-green-600 dark:text-green-400 font-semibold">
                <ShieldCheck className="h-4 w-4" />
                <span>Verified NIET Student Community</span>
              </div>
            </div>

            {/* Quick Navigation */}
            <div>
              <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider mb-3">
                Quick Navigation
              </h4>
              <ul className="space-y-2 text-xs text-gray-500 dark:text-gray-400 font-medium">
                <li>
                  <Link to="/home" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center gap-1.5">
                    <Home className="h-3.5 w-3.5" />
                    <span>Home Screen</span>
                  </Link>
                </li>
                <li>
                  <Link to="/explore" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center gap-1.5">
                    <Compass className="h-3.5 w-3.5" />
                    <span>Explore Marketplace</span>
                  </Link>
                </li>
                <li>
                  <Link to="/my-rentals" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center gap-1.5">
                    <Package className="h-3.5 w-3.5" />
                    <span>Orders & Rental Requests</span>
                  </Link>
                </li>
                <li>
                  <Link to="/wishlist" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center gap-1.5">
                    <Heart className="h-3.5 w-3.5 text-red-500" />
                    <span>Wishlist & Cart</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Manage & List */}
            <div>
              <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider mb-3">
                Manage & Earn
              </h4>
              <ul className="space-y-2 text-xs text-gray-500 dark:text-gray-400 font-medium">
                <li>
                  <Link to="/list-item" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center gap-1.5">
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span>List a New Item</span>
                  </Link>
                </li>
                <li>
                  <Link to="/my-listings" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                    My Listed Products
                  </Link>
                </li>
                <li>
                  <Link to="/messages" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                    Rental Chats & Messages
                  </Link>
                </li>
                <li>
                  <Link to="/profile" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                    My Account Profile
                  </Link>
                </li>
              </ul>
            </div>

            {/* Student Safety Notice */}
            <div className="p-4 bg-gray-50 dark:bg-slate-800/60 rounded-2xl border border-gray-100 dark:border-slate-800">
              <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 mb-1">
                Offline Payments
              </h4>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                Rentora is a discovery platform for college students. Payments and item inspections happen directly between students in campus public areas.
              </p>
            </div>

          </div>

          <div className="pt-6 border-t border-gray-100 dark:border-slate-800 text-center text-xs text-gray-400">
            &copy; {new Date().getFullYear()} Rentora Marketplace. Built for college students.
          </div>
        </div>
      </footer>

      {/* Mobile bottom bar shortcut */}
      <MobileBottomNav />
    </div>
  );
};

export default MainLayout;

import React from 'react';
import Navbar from '../components/Navbar';
import MobileBottomNav from '../components/MobileBottomNav';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-200">
      {/* Header navbar */}
      <Navbar />

      {/* Main page content area */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-8">
        {children}
      </main>

      {/* Mobile bottom bar shortcut */}
      <MobileBottomNav />
    </div>
  );
};

export default MainLayout;

import React from 'react';
import { Link } from 'react-router-dom';
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
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12">
        {children}
      </main>

      {/* Rentomojo-Inspired Structured Footer */}
      <footer className="hidden md:block bg-slate-900 text-slate-300 border-t border-slate-800 py-12 mt-auto transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            
            {/* Column 1: Brand & App Badges */}
            <div className="space-y-4">
              <Link to="/home" className="flex items-center space-x-2.5">
                <span className="h-9 w-9 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-500 flex items-center justify-center text-white font-extrabold text-xl shadow-md shadow-primary-500/20">
                  R
                </span>
                <span className="font-outfit font-black text-2xl tracking-tight bg-gradient-to-r from-primary-500 to-indigo-400 bg-clip-text text-transparent">
                  Rentora
                </span>
              </Link>
              <p className="text-xs text-slate-400 leading-relaxed">
                Rentora is the premier peer-to-peer campus rental platform. Save money by borrowing essentials from classmates or listing your own idle stuff for side cash.
              </p>
              
              <div className="pt-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">Download our App</p>
                <div className="flex flex-col gap-2 max-w-[170px]">
                  <a href="#" className="flex items-center space-x-2 bg-slate-950 text-white px-3.5 py-1.5 rounded-xl border border-slate-800 hover:bg-slate-900 transition-all shadow group active:scale-95">
                    <svg className="w-5 h-5 fill-current text-primary-500 group-hover:text-primary-400 transition-colors" viewBox="0 0 24 24">
                      <path d="M3 20.285V3.716c0-.983.743-1.637 1.636-1.696L15.96 12 4.636 21.98C3.743 21.92 3 21.268 3 20.285zM17.15 13.064l2.843-1.64c.895-.516.895-1.34 0-1.856L17.15 7.93 15.96 12l1.19 1.064zM4.636 2.02l11.324 6.54L13.722 12l-9.086-9.98zm0 19.96L13.722 12l2.238 3.44-11.324 6.54z"/>
                    </svg>
                    <div className="text-left">
                      <span className="text-[8px] block uppercase leading-none opacity-70">Get it on</span>
                      <span className="text-[11px] font-black tracking-tight leading-tight">Google Play</span>
                    </div>
                  </a>
                  <a href="#" className="flex items-center space-x-2 bg-slate-950 text-white px-3.5 py-1.5 rounded-xl border border-slate-800 hover:bg-slate-900 transition-all shadow group active:scale-95">
                    <svg className="w-5 h-5 fill-current text-slate-200 group-hover:text-white transition-colors" viewBox="0 0 24 24">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.82M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.22.67-2.94 1.5-.62.71-1.16 1.85-1.01 2.96 1.12.09 2.27-.59 2.96-1.4z"/>
                    </svg>
                    <div className="text-left">
                      <span className="text-[8px] block uppercase leading-none opacity-70">Download on the</span>
                      <span className="text-[11px] font-black tracking-tight leading-tight">App Store</span>
                    </div>
                  </a>
                </div>
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 border-l-2 border-primary-500 pl-2">
                Information
              </h4>
              <ul className="space-y-2.5 text-xs text-slate-400 font-medium">
                <li>
                  <Link to="/home" className="hover:text-primary-400 transition-colors">About Rentora</Link>
                </li>
                <li>
                  <Link to="/explore" className="hover:text-primary-400 transition-colors">Explore Campus Marketplace</Link>
                </li>
                <li>
                  <Link to="/my-rentals" className="hover:text-primary-400 transition-colors">My Active Rentals</Link>
                </li>
                <li>
                  <Link to="/wishlist" className="hover:text-primary-400 transition-colors">Saved Wishlist & Bag</Link>
                </li>
                <li>
                  <a href="#" className="hover:text-primary-400 transition-colors">Student Safety Guidelines</a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary-400 transition-colors">Terms of Service</a>
                </li>
              </ul>
            </div>

            {/* Column 3: Popular Categories */}
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 border-l-2 border-indigo-500 pl-2">
                Rent Categories
              </h4>
              <ul className="space-y-2.5 text-xs text-slate-400 font-medium">
                <li>
                  <Link to="/explore" className="hover:text-primary-400 transition-colors">Books & Study Material</Link>
                </li>
                <li>
                  <Link to="/explore" className="hover:text-primary-400 transition-colors">Calculators & Electronics</Link>
                </li>
                <li>
                  <Link to="/explore" className="hover:text-primary-400 transition-colors">Lab Coats & Aprons</Link>
                </li>
                <li>
                  <Link to="/explore" className="hover:text-primary-400 transition-colors">Sports Kits & Accessories</Link>
                </li>
                <li>
                  <Link to="/explore" className="hover:text-primary-400 transition-colors">Xbox & Gaming Gear</Link>
                </li>
                <li>
                  <Link to="/explore" className="hover:text-primary-400 transition-colors">Hostel Room Appliances</Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Campus Locations Served */}
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 border-l-2 border-emerald-500 pl-2">
                Locations Noida
              </h4>
              <ul className="space-y-2.5 text-xs text-slate-400 font-medium">
                <li>
                  <span className="text-slate-400">NIET Main Campus (Block A, B, C, D)</span>
                </li>
                <li>
                  <span className="text-slate-400">Knowledge Park III, Greater Noida</span>
                </li>
                <li>
                  <span className="text-slate-400">NIET Boys & Girls Hostels</span>
                </li>
                <li>
                  <span className="text-slate-400">Galgotias Campus (Knowledge Park)</span>
                </li>
                <li>
                  <span className="text-slate-400">GL Bajaj Campus</span>
                </li>
                <li>
                  <span className="text-slate-400">Knowledge Park Canteen Pickups</span>
                </li>
              </ul>
            </div>

          </div>

          {/* SEO Text Block */}
          <div className="pt-8 border-t border-slate-800 text-slate-500 text-justify text-[11px] leading-relaxed space-y-3">
            <p>
              <strong>Rentora Noida:</strong> The ultimate student-led peer rental network across Greater Noida, specifically tailored for National Institute of Engineering and Technology (NIET) students. We bring you Noida’s most convenient campus renting portal, saving you thousands of rupees on short-term necessities. No longer do you need to purchase expensive engineering textbooks, lab kits, or drawing boards for single-semester coursework.
            </p>
            <p>
              By facilitating verified peer exchanges, students can list lab coats, scientific calculators (such as Casio FX-991EX), and DSA books (Cormen) to earn side pocket money while helping their peers. All transactions and checkovers are carried out directly in safe public college locations like the Block-A canteen, college library, or hostel gates, ensuring zero shipping delays and zero additional shipping costs. Rent from classmate sellers today!
            </p>
          </div>

          {/* Final Copyright */}
          <div className="pt-6 mt-6 border-t border-slate-800/60 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500 gap-4">
            <p>&copy; {new Date().getFullYear()} Rentora. Created by students for the student community.</p>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-slate-400 transition-colors">Privacy Policy</a>
              <span>&middot;</span>
              <a href="#" className="hover:text-slate-400 transition-colors">Safety Tips</a>
              <span>&middot;</span>
              <a href="#" className="hover:text-slate-400 transition-colors">FAQ</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile bottom bar shortcut */}
      <MobileBottomNav />
    </div>
  );
};

export default MainLayout;

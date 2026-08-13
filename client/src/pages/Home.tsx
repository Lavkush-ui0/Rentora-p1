import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { discoveryService } from '../services/discoveryService';
import { listingService } from '../services/listingService';
import { categoryService } from '../services/categoryService';
import ProductCard from '../components/ProductCard';
import CoverflowSlider from '../components/CoverflowSlider';
import { 
  TrendingUp, Zap, DollarSign, Star, ChevronRight, ArrowRight, 
  Grid, Package, Sparkles, BookOpen, Cpu, 
  Shirt, Trophy, Gamepad2, Layers, ArrowLeftRight, HelpCircle, 
  ShieldCheck, Check, X, ShieldAlert, Award, MapPin
} from 'lucide-react';

const SkeletonCard = () => (
  <div className="animate-pulse bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 overflow-hidden">
    <div className="aspect-[4/3] bg-gray-100 dark:bg-slate-800"></div>
    <div className="p-4 space-y-3">
      <div className="h-4 bg-gray-100 dark:bg-slate-800 rounded-full w-3/4"></div>
      <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded-full w-1/2"></div>
      <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded-full w-2/3"></div>
    </div>
  </div>
);

interface HomepageData {
  cheapestProducts: any[];
  topDemanded: any[];
  trendingProducts: any[];
  topStudents: any[];
  topRatedProducts: any[];
}

const categoryStyleMap: { [key: string]: { icon: any, color: string, bg: string, border: string, textAccent: string } } = {
  'books-study-material': { 
    icon: BookOpen, 
    color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30', 
    bg: 'bg-rose-50/30 dark:bg-rose-950/10', 
    border: 'border-rose-100 dark:border-rose-900/20 hover:border-rose-300 dark:hover:border-rose-700',
    textAccent: 'group-hover:text-rose-600 dark:group-hover:text-rose-400'
  },
  'electronics-technical': { 
    icon: Cpu, 
    color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30', 
    bg: 'bg-blue-50/30 dark:bg-blue-950/10', 
    border: 'border-blue-100 dark:border-blue-900/20 hover:border-blue-300 dark:hover:border-blue-700',
    textAccent: 'group-hover:text-blue-600 dark:group-hover:text-blue-400'
  },
  'clothing-accessories': { 
    icon: Shirt, 
    color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30', 
    bg: 'bg-amber-50/30 dark:bg-amber-950/10', 
    border: 'border-amber-100 dark:border-amber-900/20 hover:border-amber-300 dark:hover:border-amber-700',
    textAccent: 'group-hover:text-amber-600 dark:group-hover:text-amber-400'
  },
  'sports-equipment': { 
    icon: Trophy, 
    color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30', 
    bg: 'bg-emerald-50/30 dark:bg-emerald-950/10', 
    border: 'border-emerald-100 dark:border-emerald-900/20 hover:border-emerald-300 dark:hover:border-emerald-700',
    textAccent: 'group-hover:text-emerald-600 dark:group-hover:text-emerald-400'
  },
  'gaming': { 
    icon: Gamepad2, 
    color: 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/30', 
    bg: 'bg-violet-50/30 dark:bg-violet-950/10', 
    border: 'border-violet-100 dark:border-violet-900/20 hover:border-violet-300 dark:hover:border-violet-700',
    textAccent: 'group-hover:text-violet-600 dark:group-hover:text-violet-400'
  },
  'other': { 
    icon: Layers, 
    color: 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50', 
    bg: 'bg-slate-50/30 dark:bg-slate-900/10', 
    border: 'border-slate-100 dark:border-slate-800/40 hover:border-slate-300 dark:hover:border-slate-600',
    textAccent: 'group-hover:text-slate-700 dark:group-hover:text-slate-300'
  },
};

export const Home: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<HomepageData | null>(null);
  const [allListings, setAllListings] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [allListingsLoading, setAllListingsLoading] = useState(true);
  
  // Hero Promotion Slider Index State
  const [currentHeroSlide, setCurrentHeroSlide] = useState(0);

  // Fetch Homepage Data, Categories, and Listings
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [homeRes, listingsRes, categoriesRes] = await Promise.all([
          discoveryService.getHomepageData(),
          listingService.getListings({ limit: 12, status: 'ACTIVE' }),
          categoryService.getCategories(),
        ]);

        if (homeRes.data?.success) {
          setData(homeRes.data.data);
        }
        if (listingsRes.data?.success) {
          setAllListings(listingsRes.data.listings);
        }
        if (categoriesRes.data?.success) {
          setCategories(categoriesRes.data.categories);
        }
      } catch (err) {
        console.error('[Home] Error fetching data:', err);
      } finally {
        setLoading(false);
        setAllListingsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Automatic hero slider cycle (5 seconds per slide)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHeroSlide((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const heroSlides = [
    {
      title: "Renting is the New Smart.",
      description: "Why buy a scientific calculator, drawing board, or DSA textbook for just one semester? Borrow from classmates at 1/10th of buying cost.",
      cta: "Explore Marketplace",
      link: "/explore",
      bgClass: "from-primary-600 via-primary-700 to-indigo-600 shadow-primary-500/20",
      badge: "NIET Noida Campus Marketplace"
    },
    {
      title: "Got Idle Stuff? Earn Pocket Money.",
      description: "List your lab coats, electronics projects, gaming pads, or textbooks that are lying around. Handover directly in campus to earn cash.",
      cta: "List An Item",
      link: user ? "/list-item" : "/register",
      bgClass: "from-violet-600 via-purple-700 to-pink-600 shadow-purple-500/20",
      badge: "Peer Earning Platform"
    },
    {
      title: "Verified Student Exchange.",
      description: "Rent with peace of mind. Every member on Rentora is a verified classmate with an official college email address. Safe canteen pick-ups.",
      cta: "View Active Rentals",
      link: "/explore",
      bgClass: "from-emerald-600 via-teal-700 to-cyan-600 shadow-teal-500/20",
      badge: "Safety First Community"
    }
  ];

  const SectionHeader = ({ icon: Icon, title, subtitle, linkTo }: any) => (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-3">
        <div className="p-2.5 rounded-2xl bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-black font-outfit text-gray-900 dark:text-gray-100">{title}</h2>
          {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <Link to={linkTo} className="flex items-center text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline">
        See all <ChevronRight className="h-4 w-4 ml-0.5" />
      </Link>
    </div>
  );

  return (
    <div className="space-y-16 pb-12">

      {/* Rentomojo-style Hero Grid: Slider on Left, Category Grid on Right */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left 7 Columns: Promotional Banner Slider */}
        <div className={`lg:col-span-7 flex flex-col justify-between relative overflow-hidden rounded-[2rem] bg-gradient-to-r p-8 md:p-10 text-white shadow-xl transition-all duration-500 ease-in-out min-h-[350px] md:min-h-[420px] ${heroSlides[currentHeroSlide].bgClass}`}>
          
          {/* Decorative shapes */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-0 right-0 w-72 h-72 bg-white rounded-full -translate-y-1/3 translate-x-1/3"></div>
            <div className="absolute bottom-0 left-0 w-52 h-52 bg-white rounded-full translate-y-1/3 -translate-x-1/3"></div>
          </div>

          {/* Slide Content */}
          <div className="relative z-10 space-y-4 max-w-xl">
            <div className="inline-flex items-center space-x-2 bg-white/20 px-3.5 py-1.5 rounded-full text-xs font-bold mb-2 backdrop-blur-sm">
              <span className="h-2.5 w-2.5 bg-green-400 rounded-full animate-pulse"></span>
              <span>{heroSlides[currentHeroSlide].badge}</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black font-outfit leading-tight drop-shadow-sm transition-all duration-300">
              {heroSlides[currentHeroSlide].title}
            </h1>
            <p className="text-white/90 text-sm md:text-base leading-relaxed transition-all duration-300 font-medium">
              {heroSlides[currentHeroSlide].description}
            </p>
          </div>

          {/* Action and Indicators */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-white/10 mt-6">
            <Link
              to={heroSlides[currentHeroSlide].link}
              className="bg-white text-gray-900 font-extrabold px-6 py-3 rounded-full text-sm hover:bg-slate-100 transition-all flex items-center space-x-2 shadow-lg active:scale-95"
            >
              <span>{heroSlides[currentHeroSlide].cta}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            {/* Slider dots */}
            <div className="flex space-x-2">
              {heroSlides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentHeroSlide(idx)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === currentHeroSlide ? 'w-6 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'
                  }`}
                  title={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right 5 Columns: Category Grid */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-white dark:bg-slate-900 rounded-[2rem] border border-gray-100 dark:border-slate-800 p-6 shadow-xl">
          <div className="mb-4">
            <h3 className="text-base font-black font-outfit text-gray-900 dark:text-gray-100">
              What would you like to rent today?
            </h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              Select a category to view verified items listed on campus.
            </p>
          </div>

          {categories.length > 0 ? (
            <div className="grid grid-cols-3 gap-3 md:gap-4 flex-grow my-2">
              {categories.slice(0, 6).map((cat) => {
                const style = categoryStyleMap[cat.slug] || { 
                  icon: Layers, 
                  color: 'text-gray-600 bg-gray-100', 
                  bg: 'bg-gray-50', 
                  border: 'border-gray-100',
                  textAccent: ''
                };
                const IconComp = style.icon;
                return (
                  <Link
                    key={cat._id}
                    to={`/explore?category=${cat._id}`}
                    className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border ${style.border} ${style.bg} hover:shadow-md hover:scale-105 active:scale-[0.98] transition-all text-center group`}
                  >
                    <div className={`p-2.5 rounded-2xl shadow-sm mb-2 ${style.color} group-hover:scale-110 transition-transform`}>
                      <IconComp className="h-5 w-5 md:h-6 md:w-6" />
                    </div>
                    <span className={`text-[10px] md:text-xs font-bold font-outfit text-gray-900 dark:text-slate-200 line-clamp-1 leading-tight ${style.textAccent} transition-colors`}>
                      {cat.name.split(' & ')[0]}
                    </span>
                    <span className="text-[8px] md:text-[9px] text-gray-400 dark:text-gray-500 mt-0.5 hidden sm:block">
                      Rent now
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 flex-grow my-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse bg-gray-50 dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 h-24"></div>
              ))}
            </div>
          )}

          <Link
            to="/explore"
            className="w-full text-center py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 border border-slate-200/50 dark:border-slate-800 text-xs font-extrabold text-primary-600 dark:text-primary-400 transition-colors flex items-center justify-center space-x-1.5 active:scale-95"
          >
            <span>Explore All Listings</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* 3D Coverflow Showcase */}
      {!loading && data?.topRatedProducts && data.topRatedProducts.length > 0 && (
        <CoverflowSlider listings={data.topRatedProducts} />
      )}

      {/* Interactive Rent vs Buy vs EMI Section */}
      <section className="bg-gradient-to-b from-gray-50 to-white dark:from-slate-900/40 dark:to-slate-950 p-6 md:p-10 rounded-[2.5rem] border border-gray-100 dark:border-slate-850 shadow-md">
        <div className="text-center max-w-xl mx-auto mb-10">
          <div className="inline-flex items-center space-x-1.5 bg-primary-100 dark:bg-primary-950/40 text-primary-700 dark:text-primary-400 px-3.5 py-1.5 rounded-full text-xs font-bold mb-3 border border-primary-200 dark:border-primary-800/40">
            <ArrowLeftRight className="h-3.5 w-3.5" />
            <span>Smart Economics Comparison</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black font-outfit text-gray-900 dark:text-white leading-tight">
            Rent vs. Buy vs. EMI
          </h2>
          <p className="text-xs md:text-sm text-gray-400 dark:text-gray-500 mt-1.5">
            Discover why student renting on Rentora is Noida’s most practical campus solution.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          
          {/* Card 1: Renting */}
          <div className="relative bg-white dark:bg-slate-900 border-2 border-primary-500 dark:border-primary-500 rounded-3xl p-6 shadow-xl flex flex-col justify-between scale-[1.02] z-10 transition-transform">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary-500 text-white font-extrabold text-[10px] uppercase tracking-wider px-4 py-1.5 rounded-full shadow border border-primary-400">
              Highly Recommended
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
                <h4 className="font-outfit font-black text-lg text-primary-600 dark:text-primary-400">Renting on Rentora</h4>
                <Sparkles className="h-5 w-5 text-primary-500" />
              </div>

              <ul className="space-y-3.5">
                <li className="flex items-start space-x-2 text-xs">
                  <Check className="h-4 w-4 text-green-500 stroke-[3] mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300"><strong>Pay-as-you-use:</strong> Pay ₹10-₹50/week. Return it when exams are finished.</span>
                </li>
                <li className="flex items-start space-x-2 text-xs">
                  <Check className="h-4 w-4 text-green-500 stroke-[3] mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300"><strong>Zero shipping cost:</strong> Free canteen / hostel handovers directly from classmates.</span>
                </li>
                <li className="flex items-start space-x-2 text-xs">
                  <Check className="h-4 w-4 text-green-500 stroke-[3] mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300"><strong>Zero debt burden:</strong> Avoid bank cards, document upload, and monthly EMIs.</span>
                </li>
                <li className="flex items-start space-x-2 text-xs">
                  <Check className="h-4 w-4 text-green-500 stroke-[3] mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300"><strong>No reselling hassle:</strong> Hand it back at semester end instead of looking for buyers.</span>
                </li>
              </ul>
            </div>

            <div className="pt-6 border-t border-gray-100 dark:border-slate-800 text-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Average Expense</span>
              <p className="font-outfit font-black text-2xl text-gray-900 dark:text-white mt-0.5">₹10 – ₹50 <span className="text-xs font-normal text-gray-500">/ week</span></p>
            </div>
          </div>

          {/* Card 2: Buying */}
          <div className="bg-white/60 dark:bg-slate-900/40 border border-gray-100 dark:border-slate-850 rounded-3xl p-6 flex flex-col justify-between opacity-85 hover:opacity-100 transition-opacity">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
                <h4 className="font-outfit font-black text-lg text-gray-700 dark:text-gray-300">Buying Retail</h4>
                <ShieldAlert className="h-5 w-5 text-gray-400" />
              </div>

              <ul className="space-y-3.5">
                <li className="flex items-start space-x-2 text-xs">
                  <X className="h-4 w-4 text-red-500 stroke-[3] mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600 dark:text-gray-400"><strong>Massive initial expense:</strong> Spend ₹1,200+ on lab coats, reference books, or calculations.</span>
                </li>
                <li className="flex items-start space-x-2 text-xs">
                  <X className="h-4 w-4 text-red-500 stroke-[3] mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600 dark:text-gray-400"><strong>High depreciation:</strong> Values drop 70% as soon as a book is marked or used.</span>
                </li>
                <li className="flex items-start space-x-2 text-xs">
                  <X className="h-4 w-4 text-red-500 stroke-[3] mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600 dark:text-gray-400"><strong>Hostel storage issues:</strong> Tiny closet spaces clogged with stuff you only use twice.</span>
                </li>
                <li className="flex items-start space-x-2 text-xs">
                  <X className="h-4 w-4 text-red-500 stroke-[3] mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600 dark:text-gray-400"><strong>Resell headache:</strong> Posting fliers, bargaining on groups, and getting fraction values.</span>
                </li>
              </ul>
            </div>

            <div className="pt-6 border-t border-gray-100 dark:border-slate-800 text-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Average Expense</span>
              <p className="font-outfit font-black text-2xl text-gray-700 dark:text-gray-300 mt-0.5">₹1,000 – ₹5,000 <span className="text-xs font-normal text-gray-500">upfront</span></p>
            </div>
          </div>

          {/* Card 3: EMI Commitments */}
          <div className="bg-white/60 dark:bg-slate-900/40 border border-gray-100 dark:border-slate-850 rounded-3xl p-6 flex flex-col justify-between opacity-85 hover:opacity-100 transition-opacity">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
                <h4 className="font-outfit font-black text-lg text-gray-700 dark:text-gray-300">Finance EMI</h4>
                <ShieldAlert className="h-5 w-5 text-gray-400" />
              </div>

              <ul className="space-y-3.5">
                <li className="flex items-start space-x-2 text-xs">
                  <X className="h-4 w-4 text-red-500 stroke-[3] mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600 dark:text-gray-400"><strong>Strict lock-in:</strong> Bound to pay monthly installments for 3-6 months.</span>
                </li>
                <li className="flex items-start space-x-2 text-xs">
                  <X className="h-4 w-4 text-red-500 stroke-[3] mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600 dark:text-gray-400"><strong>KYC verification:</strong> Requires parents' bank statements, PAN card, and approvals.</span>
                </li>
                <li className="flex items-start space-x-2 text-xs">
                  <X className="h-4 w-4 text-red-500 stroke-[3] mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600 dark:text-gray-400"><strong>High interest cost:</strong> Processing fees, processing delays, and late penalty charges.</span>
                </li>
                <li className="flex items-start space-x-2 text-xs">
                  <X className="h-4 w-4 text-red-500 stroke-[3] mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600 dark:text-gray-400"><strong>Risk of default:</strong> Affects credit scores early in life if payments miss.</span>
                </li>
              </ul>
            </div>

            <div className="pt-6 border-t border-gray-100 dark:border-slate-800 text-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Average Expense</span>
              <p className="font-outfit font-black text-2xl text-gray-700 dark:text-gray-300 mt-0.5">₹300 – ₹800 <span className="text-xs font-normal text-gray-500">/ month + Int.</span></p>
            </div>
          </div>

        </div>

        {/* Benefits Badges Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-10 border-t border-gray-100/80 dark:border-slate-850 mt-10 text-center">
          <div className="flex flex-col items-center space-y-1.5">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-full">
              <MapPin className="h-5 w-5" />
            </div>
            <h5 className="text-xs font-black text-gray-900 dark:text-white">Zero Shipping Costs</h5>
            <p className="text-[10px] text-gray-400 dark:text-gray-500">Handover directly in campus canteens or libraries.</p>
          </div>
          <div className="flex flex-col items-center space-y-1.5">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-full">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h5 className="text-xs font-black text-gray-900 dark:text-white">Verified Profiles</h5>
            <p className="text-[10px] text-gray-400 dark:text-gray-500">Only accessible to students with active NIET emails.</p>
          </div>
          <div className="flex flex-col items-center space-y-1.5">
            <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-full">
              <Zap className="h-5 w-5" />
            </div>
            <h5 className="text-xs font-black text-gray-900 dark:text-white">Flexible Tenures</h5>
            <p className="text-[10px] text-gray-400 dark:text-gray-500">Rent for a single day, a week, or a whole semester.</p>
          </div>
          <div className="flex flex-col items-center space-y-1.5">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-full">
              <Award className="h-5 w-5" />
            </div>
            <h5 className="text-xs font-black text-gray-900 dark:text-white">Community Trust</h5>
            <p className="text-[10px] text-gray-400 dark:text-gray-500">Star-ratings and reviews build student reputation.</p>
          </div>
        </div>
      </section>

      {/* "How It Works" Section */}
      <section className="space-y-8">
        <div className="text-center max-w-xl mx-auto">
          <div className="inline-flex items-center space-x-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 px-3.5 py-1.5 rounded-full text-xs font-bold mb-3 border border-indigo-200 dark:border-indigo-800/40">
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Simple Guide</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black font-outfit text-gray-900 dark:text-white leading-tight">
            How Rentora Works
          </h2>
          <p className="text-xs md:text-sm text-gray-400 dark:text-gray-500 mt-1.5">
            Renting from a classmate is quick, safe, and takes less than 2 minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {/* Step 1 */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 hover:shadow-lg transition-all text-center space-y-3 relative group">
            <span className="absolute top-4 right-4 text-3xl font-black text-slate-100 dark:text-slate-800 font-outfit select-none">01</span>
            <div className="h-12 w-12 mx-auto bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center font-extrabold group-hover:scale-110 transition-transform">
              <Grid className="h-6 w-6" />
            </div>
            <h4 className="font-outfit font-black text-sm text-gray-900 dark:text-white">1. Select Item</h4>
            <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
              Browse study materials, tools, gaming pads, or clothes listed by your campus peers.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 hover:shadow-lg transition-all text-center space-y-3 relative group">
            <span className="absolute top-4 right-4 text-3xl font-black text-slate-100 dark:text-slate-800 font-outfit select-none">02</span>
            <div className="h-12 w-12 mx-auto bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center font-extrabold group-hover:scale-110 transition-transform">
              <Sparkles className="h-6 w-6" />
            </div>
            <h4 className="font-outfit font-black text-sm text-gray-900 dark:text-white">2. Book & Chat</h4>
            <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
              Select rental dates, click Rent, and use the built-in campus chat to coordinate.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 hover:shadow-lg transition-all text-center space-y-3 relative group">
            <span className="absolute top-4 right-4 text-3xl font-black text-slate-100 dark:text-slate-800 font-outfit select-none">03</span>
            <div className="h-12 w-12 mx-auto bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center font-extrabold group-hover:scale-110 transition-transform">
              <MapPin className="h-6 w-6" />
            </div>
            <h4 className="font-outfit font-black text-sm text-gray-900 dark:text-white">3. Meet & Inspect</h4>
            <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
              Meet up near college canteens or hostel gates to inspect item quality in person.
            </p>
          </div>

          {/* Step 4 */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 hover:shadow-lg transition-all text-center space-y-3 relative group">
            <span className="absolute top-4 right-4 text-3xl font-black text-slate-100 dark:text-slate-800 font-outfit select-none">04</span>
            <div className="h-12 w-12 mx-auto bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center font-extrabold group-hover:scale-110 transition-transform">
              <Package className="h-6 w-6" />
            </div>
            <h4 className="font-outfit font-black text-sm text-gray-900 dark:text-white">4. Pay & Return</h4>
            <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
              Pay offline directly via UPI or cash, enjoy the item, and meet back to return it.
            </p>
          </div>
        </div>
      </section>

      {/* Offline Payment Notice */}
      <div className="p-4.5 bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/60 dark:border-amber-800/40 rounded-2xl text-center flex items-center justify-center space-x-2.5 max-w-3xl mx-auto">
        <span className="text-lg">💸</span>
        <p className="text-xs text-amber-800 dark:text-amber-400 font-medium">
          <strong>Safe Transaction Notice:</strong> Rentora is a marketplace for discovery. Always meet inside the college campus and pay <strong>offline directly to the student lender</strong> when you receive the item.
        </p>
      </div>

      {/* Featured All Campus Listings */}
      <section>
        <SectionHeader 
          icon={Grid} 
          title="All Listed Items" 
          subtitle="Latest rentals uploaded by NIET students" 
          linkTo="/explore" 
        />
        {allListingsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : allListings.length > 0 ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {allListings.slice(0, 8).map((listing: any) => (
                <ProductCard key={listing._id} listing={listing} />
              ))}
            </div>
            <div className="text-center pt-2">
              <Link
                to="/explore"
                className="inline-flex items-center space-x-2 bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800/60 font-extrabold px-6 py-3 rounded-2xl text-sm hover:bg-primary-100 transition-all shadow-sm active:scale-95"
              >
                <Sparkles className="h-4 w-4" />
                <span>View All {allListings.length > 8 ? 'Items & Categories' : 'Listings'} on Explore</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ) : (
          <EmptyState message="No active listings yet. Be the first to list an item!" />
        )}
      </section>

      {/* Top Demanded Products */}
      <section>
        <SectionHeader icon={TrendingUp} title="Top Demanded" subtitle="Most requested items on campus" linkTo="/explore?sort=popular" />
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : data?.topDemanded?.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.topDemanded.slice(0, 6).map((listing: any) => (
              <ProductCard key={listing._id} listing={listing} />
            ))}
          </div>
        ) : (
          <EmptyState message="No listings yet. Be the first to list an item!" />
        )}
      </section>

      {/* Trending This Week */}
      <section>
        <SectionHeader icon={Zap} title="Trending This Week" subtitle="Hot picks in the last 7 days" linkTo="/explore?sort=trending" />
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : data?.trendingProducts?.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.trendingProducts.slice(0, 6).map((listing: any) => (
              <ProductCard key={listing._id} listing={listing} />
            ))}
          </div>
        ) : (
          <EmptyState message="Not enough weekly data yet. Check back soon!" />
        )}
      </section>

      {/* Student Testimonials Section */}
      <section className="space-y-8">
        <div className="text-center max-w-xl mx-auto">
          <div className="inline-flex items-center space-x-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-3.5 py-1.5 rounded-full text-xs font-bold mb-3 border border-emerald-200 dark:border-emerald-800/40">
            <Award className="h-3.5 w-3.5" />
            <span>Success Stories</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black font-outfit text-gray-900 dark:text-white leading-tight">
            What Classmates are Saying
          </h2>
          <p className="text-xs md:text-sm text-gray-400 dark:text-gray-500 mt-1.5">
            Real feedback from engineering students renting and lending on Rentora.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Testimonial 1 */}
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col justify-between hover:shadow-md transition-all space-y-4">
            <p className="text-xs italic text-gray-500 dark:text-gray-400 leading-relaxed">
              "Rented a scientific calculator Casio fx-991EX for my Math-III end sem exam for just ₹20. Saved me from buying a brand new calculator that I would never use again!"
            </p>
            <div className="flex items-center space-x-3 pt-2">
              <img src="https://api.dicebear.com/7.x/adventurer/svg?seed=Priya" alt="Priya" className="h-9 w-9 rounded-full bg-primary-100" />
              <div>
                <h5 className="text-xs font-bold text-gray-900 dark:text-white">Priya Patel</h5>
                <span className="text-[10px] text-gray-400 block">B.Tech (ECE) · Yr 2</span>
              </div>
            </div>
          </div>

          {/* Testimonial 2 */}
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col justify-between hover:shadow-md transition-all space-y-4">
            <p className="text-xs italic text-gray-500 dark:text-gray-400 leading-relaxed">
              "I listed my old engineering drawing board and chemistry lab coat. Cleared some space in my hostel wardrobe and earned over ₹600 this month! Met the buyers at Block-A canteen."
            </p>
            <div className="flex items-center space-x-3 pt-2">
              <img src="https://api.dicebear.com/7.x/adventurer/svg?seed=Rahul" alt="Rahul" className="h-9 w-9 rounded-full bg-primary-100" />
              <div>
                <h5 className="text-xs font-bold text-gray-900 dark:text-white">Rahul Sharma</h5>
                <span className="text-[10px] text-gray-400 block">B.Tech (CSE) · Yr 3</span>
              </div>
            </div>
          </div>

          {/* Testimonial 3 */}
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col justify-between hover:shadow-md transition-all space-y-4">
            <p className="text-xs italic text-gray-500 dark:text-gray-400 leading-relaxed">
              "Renting is super easy. Built-in chats let me message lenders to negotiate dates and prices. Finding lab kits for my projects took less than a minute. Highly recommend Rentora!"
            </p>
            <div className="flex items-center space-x-3 pt-2">
              <img src="https://api.dicebear.com/7.x/adventurer/svg?seed=Aman" alt="Aman" className="h-9 w-9 rounded-full bg-primary-100" />
              <div>
                <h5 className="text-xs font-bold text-gray-900 dark:text-white">Aman Verma</h5>
                <span className="text-[10px] text-gray-400 block">B.Tech (ME) · Yr 2</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Budget Friendly Section */}
      <section>
        <SectionHeader icon={DollarSign} title="Budget Friendly" subtitle="Lowest rental prices on campus" linkTo="/explore?sort=price_asc" />
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : data?.cheapestProducts?.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.cheapestProducts.slice(0, 6).map((listing: any) => (
              <ProductCard key={listing._id} listing={listing} />
            ))}
          </div>
        ) : (
          <EmptyState message="No listings available yet." />
        )}
      </section>

      {/* Top Rated Students This Week */}
      <section>
        <SectionHeader icon={Star} title="Top Rated Students" subtitle="Highly rated renters & lenders this week" linkTo="/explore" />
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse flex flex-col items-center space-y-2 p-4 bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800">
                <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-slate-800"></div>
                <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded-full w-3/4"></div>
                <div className="h-2 bg-gray-100 dark:bg-slate-800 rounded-full w-1/2"></div>
              </div>
            ))}
          </div>
        ) : data?.topStudents?.length ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {data.topStudents.map((student: any) => (
              <Link
                key={student._id}
                to={`/profile/${student._id}`}
                className="flex flex-col items-center space-y-2.5 p-4 bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 hover:shadow-lg hover:border-primary-200 dark:hover:border-primary-800 transition-all group text-center"
              >
                <div className="relative flex-shrink-0">
                  <img src={student.avatar} alt={student.fullName} className="h-14 w-14 rounded-full border-2 border-white dark:border-slate-800 shadow-md object-cover" />
                  <div className="absolute -bottom-1 -right-1 bg-amber-400 text-amber-900 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full border border-white dark:border-slate-900 shadow">
                    ⭐ {student.ratingAverage?.toFixed(1) || '5.0'}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900 dark:text-gray-100 group-hover:text-primary-600 transition-colors line-clamp-1">{student.fullName}</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500">{student.course} · Yr {student.year}</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{student.completedRentals} rentals</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState message="No rated students yet this week." />
        )}
      </section>
    </div>
  );
};

const EmptyState = ({ message }: { message: string }) => (
  <div className="text-center py-12 text-gray-400 dark:text-gray-600">
    <p className="text-sm">{message}</p>
  </div>
);

export default Home;

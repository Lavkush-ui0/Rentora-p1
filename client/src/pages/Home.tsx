import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { discoveryService } from '../services/discoveryService';
import { listingService } from '../services/listingService';
import ProductCard from '../components/ProductCard';
import { 
  TrendingUp, Zap, DollarSign, Star, ChevronRight, ArrowRight, 
  Grid, Heart, PlusCircle, Package, Sparkles 
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
}

export const Home: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<HomepageData | null>(null);
  const [allListings, setAllListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [allListingsLoading, setAllListingsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [homeRes, listingsRes] = await Promise.all([
          discoveryService.getHomepageData(),
          listingService.getListings({ limit: 12, status: 'ACTIVE' }),
        ]);

        if (homeRes.data?.success) {
          setData(homeRes.data.data);
        }
        if (listingsRes.data?.success) {
          setAllListings(listingsRes.data.listings);
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
    <div className="space-y-12 pb-10">

      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary-600 via-primary-700 to-indigo-600 p-7 md:p-10 text-white shadow-2xl shadow-primary-500/25">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2"></div>
        </div>
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 bg-white/20 px-3 py-1.5 rounded-full text-xs font-bold mb-4 backdrop-blur-sm">
            <span className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></span>
            <span>NIET Campus Marketplace</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black font-outfit leading-tight mb-3">
            Rent Anything.<br/>
            <span className="text-primary-200">From Your Classmates.</span>
          </h1>
          <p className="text-primary-100 text-sm md:text-base mb-6 leading-relaxed">
            Books, scientific calculators, lab coats, laptops, gaming gear — borrow affordably and earn by renting out your stuff.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/explore"
              className="bg-white text-primary-700 font-bold px-5 py-2.5 rounded-full text-sm hover:bg-primary-50 transition-all flex items-center space-x-2 shadow-lg"
            >
              <span>Explore All Rentals</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            {user ? (
              <>
                <Link
                  to="/list-item"
                  className="bg-white/20 text-white font-bold px-5 py-2.5 rounded-full text-sm hover:bg-white/30 transition-all border border-white/30 flex items-center space-x-1.5"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>List An Item</span>
                </Link>
                <Link
                  to="/my-rentals"
                  className="bg-white/10 text-white font-bold px-4 py-2.5 rounded-full text-sm hover:bg-white/20 transition-all border border-white/20 flex items-center space-x-1.5"
                >
                  <Package className="h-4 w-4" />
                  <span>My Orders</span>
                </Link>
              </>
            ) : (
              <Link
                to="/register"
                className="bg-white/20 text-white font-bold px-5 py-2.5 rounded-full text-sm hover:bg-white/30 transition-all border border-white/30"
              >
                Join Rentora
              </Link>
            )}
            <Link
              to="/wishlist"
              className="bg-white/10 text-white font-bold px-4 py-2.5 rounded-full text-sm hover:bg-white/20 transition-all border border-white/20 flex items-center space-x-1.5"
            >
              <Heart className="h-4 w-4 text-red-300 fill-red-300" />
              <span>Saved Items</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Offline Payment Notice */}
      <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl text-center">
        <p className="text-sm text-amber-800 dark:text-amber-400 font-medium">
          💸 <strong>Payment Notice:</strong> All rental payments are settled <strong>offline directly between students</strong> at pickup/handover.
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
              {allListings.map((listing: any) => (
                <ProductCard key={listing._id} listing={listing} />
              ))}
            </div>
            <div className="text-center pt-2">
              <Link
                to="/explore"
                className="inline-flex items-center space-x-2 bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800/60 font-bold px-6 py-3 rounded-2xl text-sm hover:bg-primary-100 transition-all shadow-sm"
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
            {data.topDemanded.map((listing: any) => (
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
            {data.trendingProducts.map((listing: any) => (
              <ProductCard key={listing._id} listing={listing} />
            ))}
          </div>
        ) : (
          <EmptyState message="Not enough weekly data yet. Check back soon!" />
        )}
      </section>

      {/* Cheapest Products */}
      <section>
        <SectionHeader icon={DollarSign} title="Budget Friendly" subtitle="Lowest rental prices on campus" linkTo="/explore?sort=price_asc" />
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : data?.cheapestProducts?.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.cheapestProducts.map((listing: any) => (
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
                <div className="relative">
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

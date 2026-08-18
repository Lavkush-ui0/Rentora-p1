import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { discoveryService } from '../services/discoveryService';
import { listingService } from '../services/listingService';
import ProductCard from '../components/ProductCard';
import TrendingHeroSlider from '../components/TrendingHeroSlider';
import { PaymentNotice } from '../components/RentoraBrand';
import {
  TrendingUp, ChevronRight, ArrowRight, GraduationCap,
  ShieldCheck, MapPin, Zap
} from 'lucide-react';

/* ── Skeleton ─────────────────────────────────────────────────── */
const SkeletonCard = () => (
  <div className="skeleton rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden h-72" />
);

/* ── Plot data ───────────────────────────────────────────────── */
const PLOTS = [
  {
    id: 'Plot 19',
    name: 'Plot 19 B Block',
    spot: 'Auditorium',
    desc: 'The centre of student exchanges — events, academic lounges, and study zones.',
    accent: '#22716E',
    bg: 'bg-[#22716E]/6 dark:bg-[#22716E]/10',
    tag: 'bg-[#22716E]/10 text-[#22716E] dark:text-[#5FD2CA]',
    border: 'border-[#22716E]/20 hover:border-[#22716E]/50',
    emoji: '🏫',
  },
  {
    id: 'Plot 15',
    name: 'Plot 15 Canteen Spot',
    spot: 'Canteen Gate',
    desc: 'Ideal for textbook handovers, calculator swaps, and quiet meetups.',
    accent: '#9E1B1B',
    bg: 'bg-[#9E1B1B]/5 dark:bg-[#9E1B1B]/10',
    tag: 'bg-[#9E1B1B]/10 text-[#9E1B1B] dark:text-[#E8AEAE]',
    border: 'border-[#9E1B1B]/20 hover:border-[#9E1B1B]/50',
    emoji: '📚',
  },
  {
    id: 'Plot 14',
    name: 'Plot 14 Basketball Court',
    spot: 'Near Basketball Court',
    desc: 'Best for sports equipment, aprons, electronics kits, and project parts.',
    accent: '#B45309',
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    tag: 'bg-amber-100 text-amber-700 dark:text-amber-400',
    border: 'border-amber-200/60 hover:border-amber-300',
    emoji: '🔬',
  },
];

/* ── Trust Rules ─────────────────────────────────────────────── */
const RULES = [
  { icon: '🤝', title: 'In-Person Pickup', desc: 'Every exchange happens at a verified campus landmark spot — no doorstep delivery.' },
  { icon: '💵', title: 'Cash or UPI Only', desc: 'Zero online payment processing. Settle in person, in full, before taking the item.' },
  { icon: '🔐', title: 'OTP Handover Code', desc: 'Both parties confirm the handover with a one-time 6-digit OTP inside the app.' },
  { icon: '⭐', title: 'Student Reputation', desc: 'Every completed exchange earns mutual ratings — your rep is your credit score here.' },
];

interface HomepageData {
  cheapestProducts: any[];
  topDemanded: any[];
  trendingProducts: any[];
  topStudents: any[];
  topRatedProducts: any[];
}

export const Home: React.FC = () => {
  const [data, setData] = useState<HomepageData | null>(null);
  const [allListings, setAllListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState(
    localStorage.getItem('rentora_location') || 'All'
  );

  useEffect(() => {
    const handleLocationChange = () => {
      setSelectedLocation(localStorage.getItem('rentora_location') || 'All');
    };
    window.addEventListener('rentora_location_changed', handleLocationChange);
    return () => window.removeEventListener('rentora_location_changed', handleLocationChange);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [homeRes, listingsRes] = await Promise.all([
          discoveryService.getHomepageData({ location: selectedLocation }),
          listingService.getListings({ limit: 8, status: 'ACTIVE', location: selectedLocation }),
        ]);
        if (homeRes.data?.success) setData(homeRes.data.data);
        if (listingsRes.data?.success) setAllListings(listingsRes.data.listings);
      } catch (err) {
        console.error('[Home] Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedLocation]);

  const trendingForSlider = (
    data?.trendingProducts?.length ? data.trendingProducts : allListings
  ).filter((l: any) => l && l.status === 'ACTIVE' && l.availability !== false);

  return (
    <div className="space-y-20 pb-16">

      {/* ══ 1. Hero Section ══════════════════════════════════════ */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-16 items-center pt-4">

        {/* Left: 7 cols — Copy + Stats */}
        <div className="lg:col-span-7 space-y-7 animate-fade-up">

          {/* Verified badge */}
          <div className="inline-flex items-center gap-2 bg-[#22716E]/10 dark:bg-[#22716E]/20 text-[#22716E] dark:text-[#5FD2CA] px-4 py-2 rounded-full text-[10px] font-black tracking-widest uppercase border border-[#22716E]/20 font-display">
            <GraduationCap size={13} />
            VERIFIED NIET CAMPUS MARKETPLACE
          </div>

          {/* Headline */}
          <div>
            <h1 className="text-5xl lg:text-6xl font-display font-black tracking-[-0.03em] text-slate-900 dark:text-white leading-[1.04]">
              Borrow smart.<br />
              <span style={{ color: '#22716E' }}>Belong here.</span>
            </h1>
            <p className="mt-5 text-base text-slate-500 dark:text-slate-400 max-w-[490px] leading-relaxed">
              The trusted way NIET students share what gets them through the semester — textbooks, calculators, lab gear, and more. Pay in person. Meet on campus. Zero apps fees.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-3">
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 bg-[#22716E] hover:bg-[#1a5a57] text-white font-black px-7 py-3.5 rounded-full text-[13px] uppercase tracking-wider transition-all duration-150 shadow-teal active:scale-95"
            >
              Explore campus picks <ArrowRight size={15} />
            </Link>
            <Link
              to="/list-item"
              className="inline-flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-black px-7 py-3.5 rounded-full text-[13px] uppercase tracking-wider transition-all duration-150 active:scale-95"
            >
              + List an item
            </Link>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-100 dark:border-slate-800 max-w-sm">
            {[
              { val: '1,240+', label: 'Active Students' },
              { val: '3.8k+', label: 'Campus Exchanges' },
              { val: '4.8/5', label: 'Community Rating' },
            ].map(({ val, label }) => (
              <div key={label}>
                <p className="text-xl font-display font-black text-slate-900 dark:text-white tracking-tight">{val}</p>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: 5 cols — 3D Trending Slider */}
        <div className="lg:col-span-5 flex justify-center animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <div className="w-full max-w-[340px]">
            <TrendingHeroSlider listings={trendingForSlider} />
          </div>
        </div>
      </section>

      {/* ══ 2. "In Demand Right Now" Grid ══════════════════════ */}
      <section>
        <div className="flex items-center justify-between mb-7">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#9E1B1B]/8 dark:bg-[#9E1B1B]/15">
              <TrendingUp className="h-5 w-5 text-[#9E1B1B]" />
            </div>
            <div>
              <h2 className="text-lg font-display font-black uppercase tracking-tight text-slate-900 dark:text-white">
                In Demand Right Now
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Most-requested campus gear this week</p>
            </div>
          </div>
          <Link to="/explore" className="inline-flex items-center gap-1 text-xs font-bold text-[#9E1B1B] hover:text-[#801414] transition-colors">
            See all <ChevronRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : allListings.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
            {allListings.map(listing => (
              <ProductCard key={listing._id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
            <p className="text-4xl mb-3">📦</p>
            <p className="text-sm font-bold text-slate-400">No listings yet for this location</p>
            <Link to="/list-item" className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-[#22716E] hover:underline">
              Be the first to list an item <ArrowRight size={12} />
            </Link>
          </div>
        )}
      </section>

      {/* ══ 3. Campus Plot Directory ════════════════════════════ */}
      <section className="paper-grid rounded-3xl p-8 border border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3 mb-2">
          <MapPin className="h-5 w-5 text-[#22716E]" />
          <span className="section-label">Campus Pickup Spots</span>
        </div>
        <h2 className="text-2xl font-display font-black tracking-tight text-slate-900 dark:text-white mb-2">
          3 Landmark Meetup Points
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 max-w-lg">
          All Rentora exchanges happen at these fixed campus spots. No off-campus meetups, no third-party couriers.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PLOTS.map(plot => (
            <Link
              key={plot.id}
              to={`/explore?location=${encodeURIComponent(plot.id)}`}
              className={`group relative rounded-2xl p-5 border-2 ${plot.border} ${plot.bg} transition-all duration-200 card-lift`}
            >
              <div className="text-3xl mb-4">{plot.emoji}</div>
              <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${plot.tag} mb-2 inline-block font-display`}>
                {plot.id}
              </span>
              <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white mt-2 mb-1">{plot.name}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{plot.desc}</p>
              <div className="flex items-center gap-1.5 mt-4 text-xs font-bold" style={{ color: plot.accent }}>
                <MapPin size={11} /> {plot.spot}
              </div>
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight size={16} style={{ color: plot.accent }} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ══ 4. Payment Notice ═══════════════════════════════════ */}
      <PaymentNotice />

      {/* ══ 5. Campus Ground Rules ══════════════════════════════ */}
      <section>
        <div className="flex items-center gap-3 mb-2">
          <ShieldCheck className="h-5 w-5 text-[#22716E]" />
          <span className="section-label">Trust & Safety</span>
        </div>
        <h2 className="text-2xl font-display font-black tracking-tight text-slate-900 dark:text-white mb-7">
          Campus Ground Rules
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {RULES.map(rule => (
            <div
              key={rule.title}
              className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 card-lift transition-all duration-200"
            >
              <div className="text-3xl mb-4">{rule.icon}</div>
              <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white mb-2">{rule.title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{rule.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ 6. Top-Rated Section (if data) ══════════════════════ */}
      {data?.topRatedProducts && data.topRatedProducts.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-7">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-[#22716E]/8 dark:bg-[#22716E]/15">
                <Zap className="h-5 w-5 text-[#22716E]" />
              </div>
              <div>
                <h2 className="text-lg font-display font-black uppercase tracking-tight text-slate-900 dark:text-white">
                  Top-Rated by Students
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Highest community ratings</p>
              </div>
            </div>
            <Link to="/explore?sort=rating" className="inline-flex items-center gap-1 text-xs font-bold text-[#9E1B1B] hover:text-[#801414] transition-colors">
              See all <ChevronRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
            {data.topRatedProducts.slice(0, 4).map(listing => (
              <ProductCard key={listing._id} listing={listing} />
            ))}
          </div>
        </section>
      )}

    </div>
  );
};

export default Home;

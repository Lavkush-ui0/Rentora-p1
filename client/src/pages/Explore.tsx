import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { listingService } from '../services/listingService';
import { categoryService } from '../services/categoryService';
import ProductCard from '../components/ProductCard';
import {
  Search, SlidersHorizontal, X,
  BookOpen, Calculator, FlaskConical, Cpu, GraduationCap, Layers, Compass
} from 'lucide-react';

/* ── Skeleton ─────────────────────────────────────────────────── */
const SkeletonCard = () => (
  <div className="skeleton rounded-3xl overflow-hidden h-72" />
);

/* ── Constants ───────────────────────────────────────────────── */
const SORT_OPTIONS = [
  { label: 'Newest', value: 'newest' },
  { label: 'Price ↑', value: 'price_asc' },
  { label: 'Price ↓', value: 'price_desc' },
  { label: 'Popular', value: 'popular' },
  { label: 'Trending', value: 'trending' },
];

const CONDITION_OPTIONS = ['NEW', 'LIKE_NEW', 'GOOD', 'FAIR'];
const PRICE_UNIT_OPTIONS = ['DAY', 'WEEK', 'MONTH'];

const CAMPUS_PLOTS = ['All', 'NIET Plot 19', 'NIET Plot 15', 'NIET Plot 14'];

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'Books': <BookOpen size={14} />,
  'Calculators': <Calculator size={14} />,
  'Lab Gear': <FlaskConical size={14} />,
  'Electronics': <Cpu size={14} />,
  'Campus Life': <GraduationCap size={14} />,
};

export const Explore: React.FC = () => {
  const [searchParams] = useSearchParams();

  const [location, setLocation] = useState(
    searchParams.get('location') || localStorage.getItem('rentora_location') || 'All'
  );

  // Instant local cache initialization for 0ms initial paint
  const [listings, setListings] = useState<any[]>(() => {
    try {
      const cached = sessionStorage.getItem('rentora_explore_listings');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [categories, setCategories] = useState<any[]>(() => {
    try {
      const cached = sessionStorage.getItem('rentora_categories');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [loading, setLoading] = useState(() => {
    return !sessionStorage.getItem('rentora_explore_listings');
  });

  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  const observerTarget = useRef<HTMLDivElement | null>(null);

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest');
  const [condition, setCondition] = useState(searchParams.get('condition') || '');
  const [priceUnit, setPriceUnit] = useState(searchParams.get('priceUnit') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');

  const hasFilters = Boolean(selectedCategory || condition || priceUnit || minPrice || maxPrice || search);

  useEffect(() => {
    const handleLocationChange = () => {
      setLocation(localStorage.getItem('rentora_location') || 'All');
      setPage(1);
    };
    window.addEventListener('rentora_location_changed', handleLocationChange);
    return () => window.removeEventListener('rentora_location_changed', handleLocationChange);
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await categoryService.getCategories();
      if (res.data?.success) {
        setCategories(res.data.categories);
        try { sessionStorage.setItem('rentora_categories', JSON.stringify(res.data.categories)); } catch {}
      }
    } catch (err) { console.error(err); }
  }, []);

  // Fetch initial batch (Page 1) when any filter or sort changes
  useEffect(() => {
    let isCancelled = false;

    const fetchInitial = async () => {
      if (!listings.length) {
        setLoading(true);
      }

      try {
        const params: any = { sort, page: 1, limit: 12 };
        if (search) params.search = search;
        if (selectedCategory) params.category = selectedCategory;
        if (condition) params.condition = condition;
        if (priceUnit) params.priceUnit = priceUnit;
        if (minPrice) params.minPrice = minPrice;
        if (maxPrice) params.maxPrice = maxPrice;
        if (location && location !== 'All') params.location = location;

        const res = await listingService.getListings(params);
        if (!isCancelled && res.data?.success) {
          const freshListings = res.data.listings || [];
          setListings(freshListings);
          const total = res.data.pagination?.total ?? 0;
          const totalPages = res.data.pagination?.totalPages ?? 1;
          setTotalCount(total);
          setPage(1);
          setHasMore(1 < totalPages);

          if (!hasFilters) {
            try {
              sessionStorage.setItem('rentora_explore_listings', JSON.stringify(freshListings));
            } catch {}
          }
        }
      } catch (err) {
        if (!isCancelled) console.error(err);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    fetchInitial();

    return () => {
      isCancelled = true;
    };
  }, [search, selectedCategory, sort, condition, priceUnit, minPrice, maxPrice, location]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Load next batch on scroll
  const loadMore = useCallback(async () => {
    if (loading || loadingMore || !hasMore) return;
    setLoadingMore(true);

    const nextPage = page + 1;
    try {
      const params: any = { sort, page: nextPage, limit: 12 };
      if (search) params.search = search;
      if (selectedCategory) params.category = selectedCategory;
      if (condition) params.condition = condition;
      if (priceUnit) params.priceUnit = priceUnit;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;
      if (location && location !== 'All') params.location = location;

      const res = await listingService.getListings(params);
      if (res.data?.success) {
        const newItems = res.data.listings || [];
        setListings(prev => {
          const existingIds = new Set(prev.map((item: any) => item._id));
          const uniqueNew = newItems.filter((item: any) => !existingIds.has(item._id));
          return [...prev, ...uniqueNew];
        });

        const total = res.data.pagination?.total ?? totalCount;
        const totalPages = res.data.pagination?.totalPages ?? 1;
        setTotalCount(total);
        setPage(nextPage);
        setHasMore(nextPage < totalPages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMore(false);
    }
  }, [loading, loadingMore, hasMore, page, sort, search, selectedCategory, condition, priceUnit, minPrice, maxPrice, location, totalCount]);

  useEffect(() => {
    const target = observerTarget.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          loadMore();
        }
      },
      { rootMargin: '250px' }
    );

    observer.observe(target);
    return () => {
      observer.disconnect();
    };
  }, [hasMore, loading, loadingMore, loadMore]);

  const handleSearchSubmit = (e: React.FormEvent) => { e.preventDefault(); setPage(1); };
  const clearFilters = () => {
    setSearch(''); setSelectedCategory(''); setSort('newest');
    setCondition(''); setPriceUnit(''); setMinPrice(''); setMaxPrice(''); setPage(1);
  };

  /* ── Render ─────────────────────────────────────────────────── */
  return (
    <div className="space-y-6 pb-12">

      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[#22716E]/10 dark:bg-[#22716E]/20">
            <Compass className="h-5 w-5 text-[#22716E]" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-black uppercase tracking-tight text-slate-900 dark:text-white">
              Explore Catalog
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {loading ? 'Searching...' : `${totalCount} listings near ${location === 'All' ? 'campus' : location}`}
            </p>
          </div>
        </div>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 text-xs font-bold text-[#9E1B1B] hover:text-[#801414] transition-colors"
          >
            <X size={14} /> Clear all
          </button>
        )}
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        <input
          id="explore-search"
          type="text"
          placeholder="Search items — e.g. CASIO calculator, DSA book, engineering kit..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 pl-11 pr-28 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-[#22716E]/30 focus:border-[#22716E] text-sm font-medium shadow-sm transition-all"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#22716E] hover:bg-[#1a5a57] text-white text-[10px] font-black uppercase tracking-wider px-4 py-2 rounded-xl transition-all"
        >
          Search
        </button>
      </form>

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => { setSelectedCategory(''); setPage(1); }}
          className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all border font-display ${
            !selectedCategory
              ? 'bg-[#22716E] text-white border-[#22716E] shadow-teal'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-[#22716E]/40'
          }`}
        >
          <Layers size={12} /> All Items
        </button>
        {categories.filter(c => c.isActive).map((cat) => (
          <button
            key={cat._id}
            onClick={() => { setSelectedCategory(cat._id); setPage(1); }}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all border font-display ${
              selectedCategory === cat._id
                ? 'bg-[#22716E] text-white border-[#22716E] shadow-teal'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-[#22716E]/40'
            }`}
          >
            {CATEGORY_ICONS[cat.name] ?? <Layers size={12} />}
            {cat.name}
          </button>
        ))}
      </div>

      {/* Plot Location Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {CAMPUS_PLOTS.map(plot => (
          <button
            key={plot}
            onClick={() => {
              const newLoc = plot === 'All' ? 'All' : plot;
              setLocation(newLoc);
              localStorage.setItem('rentora_location', newLoc);
              window.dispatchEvent(new Event('rentora_location_changed'));
              setPage(1);
            }}
            className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all font-display ${
              (plot === 'All' && location === 'All') || location === plot
                ? 'bg-[#9E1B1B]/10 text-[#9E1B1B] border-[#9E1B1B]/25 dark:text-[#E8AEAE]'
                : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            {plot}
          </button>
        ))}
      </div>

      {/* Sort Row + Filters Toggle */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none flex-1">
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => { setSort(opt.value); setPage(1); }}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                sort === opt.value
                  ? 'bg-[#9E1B1B]/8 text-[#9E1B1B] border-[#9E1B1B]/25 dark:bg-[#9E1B1B]/15'
                  : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setFilterOpen(!filterOpen)}
          className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
            filterOpen
              ? 'bg-[#9E1B1B] text-white border-[#9E1B1B]'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
          }`}
        >
          <SlidersHorizontal size={13} /> Filters
        </button>
      </div>

      {/* Expandable Filters Panel */}
      {filterOpen && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 grid grid-cols-2 md:grid-cols-4 gap-4 animate-scale-in">
          {[
            {
              label: 'Condition',
              value: condition,
              onChange: (v: string) => { setCondition(v); setPage(1); },
              options: CONDITION_OPTIONS.map(c => ({ value: c, label: c.replace('_', ' ') })),
            },
            {
              label: 'Rental Unit',
              value: priceUnit,
              onChange: (v: string) => { setPriceUnit(v); setPage(1); },
              options: PRICE_UNIT_OPTIONS.map(p => ({ value: p, label: p })),
            },
          ].map(({ label, value, onChange, options }) => (
            <div key={label}>
              <label className="block section-label mb-2">{label}</label>
              <select
                value={value}
                onChange={e => onChange(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#22716E]"
              >
                <option value="">Any</option>
                {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          ))}
          <div>
            <label className="block section-label mb-2">Min Price (₹)</label>
            <input
              type="number" placeholder="0" value={minPrice}
              onChange={e => { setMinPrice(e.target.value); setPage(1); }}
              className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold focus:outline-none"
            />
          </div>
          <div>
            <label className="block section-label mb-2">Max Price (₹)</label>
            <input
              type="number" placeholder="No limit" value={maxPrice}
              onChange={e => { setMaxPrice(e.target.value); setPage(1); }}
              className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* Listings Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
          {Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : listings.length > 0 ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {listings.map(listing => <ProductCard key={listing._id} listing={listing} />)}
          </div>

          {/* Sentinel for Infinite Scroll */}
          <div ref={observerTarget} className="h-4 w-full" />

          {loadingMore && (
            <div className="py-8 flex items-center justify-center gap-2 text-xs font-bold text-slate-500">
              <div className="w-4 h-4 rounded-full border-2 border-[#22716E] border-t-transparent animate-spin" />
              <span>Loading more listings...</span>
            </div>
          )}

          {!hasMore && listings.length > 0 && (
            <div className="py-10 text-center flex items-center justify-center gap-3">
              <span className="h-px w-16 bg-slate-200 dark:bg-slate-800" />
              <span className="text-xs font-bold text-slate-400">
                You've reached the end — all {totalCount} listings loaded
              </span>
              <span className="h-px w-16 bg-slate-200 dark:bg-slate-800" />
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20 space-y-3 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
          <div className="h-16 w-16 mx-auto bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center">
            <Search className="h-7 w-7 text-slate-300 dark:text-slate-600" />
          </div>
          <p className="font-display font-black text-slate-700 dark:text-slate-300 text-sm uppercase tracking-tight">No listings found</p>
          <p className="text-xs text-slate-400">Try adjusting your filters or campus location</p>
        </div>
      )}
    </div>
  );
};

export default Explore;

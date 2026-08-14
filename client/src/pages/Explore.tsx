import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { listingService } from '../services/listingService';
import { categoryService } from '../services/categoryService';
import ProductCard from '../components/ProductCard';
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight } from 'lucide-react';

const SkeletonCard = () => (
  <div className="animate-pulse bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 overflow-hidden">
    <div className="aspect-[4/3] bg-gray-100 dark:bg-slate-800"></div>
    <div className="p-4 space-y-3">
      <div className="h-4 bg-gray-100 dark:bg-slate-800 rounded-full w-3/4"></div>
      <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded-full w-1/2"></div>
    </div>
  </div>
);

const SORT_OPTIONS = [
  { label: 'Newest', value: 'newest' },
  { label: 'Price ↑', value: 'price_asc' },
  { label: 'Price ↓', value: 'price_desc' },
  { label: 'Popular', value: 'popular' },
  { label: 'Trending', value: 'trending' },
];

const CONDITION_OPTIONS = ['NEW', 'LIKE_NEW', 'GOOD', 'FAIR'];
const PRICE_UNIT_OPTIONS = ['DAY', 'WEEK', 'MONTH'];

export const Explore: React.FC = () => {
  const [searchParams] = useSearchParams();

  const [listings, setListings] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [filterOpen, setFilterOpen] = useState(false);

  // Filter state synced with URL params
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest');
  const [condition, setCondition] = useState(searchParams.get('condition') || '');
  const [priceUnit, setPriceUnit] = useState(searchParams.get('priceUnit') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [location, setLocation] = useState(localStorage.getItem('rentora_location') || 'NIET Plot 19');

  // Sync selected location when event is fired
  useEffect(() => {
    const handleLocationChange = () => {
      setLocation(localStorage.getItem('rentora_location') || 'NIET Plot 19');
      setPage(1);
    };
    window.addEventListener('rentora_location_changed', handleLocationChange);
    return () => window.removeEventListener('rentora_location_changed', handleLocationChange);
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await categoryService.getCategories();
      if (res.data?.success) setCategories(res.data.categories);
    } catch (err) { console.error(err); }
  }, []);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { sort, page, limit: 9 };
      if (search) params.search = search;
      if (selectedCategory) params.category = selectedCategory;
      if (condition) params.condition = condition;
      if (priceUnit) params.priceUnit = priceUnit;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;
      if (location) params.location = location;

      const res = await listingService.getListings(params);
      if (res.data?.success) {
        setListings(res.data.listings);
        setPagination(res.data.pagination);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [search, selectedCategory, sort, condition, priceUnit, minPrice, maxPrice, page, location]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setSort('newest');
    setCondition('');
    setPriceUnit('');
    setMinPrice('');
    setMaxPrice('');
    setPage(1);
  };

  const hasFilters = selectedCategory || condition || priceUnit || minPrice || maxPrice || search;

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black font-outfit text-gray-900 dark:text-gray-100">Explore Rentals</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            {loading ? '...' : `${pagination.total} items available`}
          </p>
        </div>
        {hasFilters && (
          <button onClick={clearFilters} className="flex items-center space-x-1.5 text-xs font-bold text-red-500 hover:text-red-600">
            <X className="h-4 w-4" />
            <span>Clear Filters</span>
          </button>
        )}
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <input
          type="text"
          placeholder="Search for items (e.g. calculator, lab coat, DSA book)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 pl-11 pr-4 py-3.5 rounded-2xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 text-sm font-medium"
        />
        <Search className="absolute left-4 top-4 h-4.5 w-4.5 text-gray-400 pointer-events-none" />
        <button type="submit" className="absolute right-3 top-2.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all">
          Search
        </button>
      </form>

      {/* Category Filters */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => { setSelectedCategory(''); setPage(1); }}
          className={`flex-shrink-0 px-4 py-2.5 rounded-full text-xs font-bold border transition-all ${
            !selectedCategory
              ? 'bg-primary-600 text-white border-primary-600'
              : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-700 hover:border-gray-300'
          }`}
        >
          All Items
        </button>
        {categories.filter(c => c.isActive).map((cat) => (
          <button
            key={cat._id}
            onClick={() => { setSelectedCategory(cat._id); setPage(1); }}
            className={`flex-shrink-0 flex items-center space-x-1.5 px-4 py-2.5 rounded-full text-xs font-bold border transition-all ${
              selectedCategory === cat._id
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-700 hover:border-gray-300'
            }`}
          >
            <span>{cat.name}</span>
          </button>
        ))}
      </div>

      {/* Sort + Filter Row */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => { setSort(opt.value); setPage(1); }}
              className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                sort === opt.value
                  ? 'bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-400 border-primary-200 dark:border-primary-800'
                  : 'bg-white dark:bg-slate-900 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-slate-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setFilterOpen(!filterOpen)}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ml-3 ${
            filterOpen
              ? 'bg-primary-600 text-white border-primary-600'
              : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-700'
          }`}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span>Filters</span>
        </button>
      </div>

      {/* Expandable Filters Panel */}
      {filterOpen && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-5 grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Condition */}
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Condition</label>
            <select
              value={condition}
              onChange={(e) => { setCondition(e.target.value); setPage(1); }}
              className="w-full bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-gray-100 px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-sm"
            >
              <option value="">Any</option>
              {CONDITION_OPTIONS.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
            </select>
          </div>
          {/* Price Unit */}
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Rental Period</label>
            <select
              value={priceUnit}
              onChange={(e) => { setPriceUnit(e.target.value); setPage(1); }}
              className="w-full bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-gray-100 px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-sm"
            >
              <option value="">Any</option>
              {PRICE_UNIT_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          {/* Min Price */}
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Min Price (₹)</label>
            <input
              type="number"
              placeholder="0"
              value={minPrice}
              onChange={(e) => { setMinPrice(e.target.value); setPage(1); }}
              className="w-full bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-gray-100 px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-sm"
            />
          </div>
          {/* Max Price */}
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Max Price (₹)</label>
            <input
              type="number"
              placeholder="No limit"
              value={maxPrice}
              onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }}
              className="w-full bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-gray-100 px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-sm"
            />
          </div>
        </div>
      )}

      {/* Listings Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(9)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : listings.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {listings.map((listing) => (
            <ProductCard key={listing._id} listing={listing} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 space-y-3">
          <div className="h-16 w-16 mx-auto bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
            <Search className="h-7 w-7 text-gray-300 dark:text-gray-600" />
          </div>
          <p className="font-bold text-gray-700 dark:text-gray-300">No listings found</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">Try adjusting your search or filters</p>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 pt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="p-2 rounded-xl border border-gray-200 dark:border-slate-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          {[...Array(pagination.totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`h-9 w-9 rounded-xl text-sm font-bold transition-all border ${
                page === i + 1
                  ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                  : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800'
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
            disabled={page >= pagination.totalPages}
            className="p-2 rounded-xl border border-gray-200 dark:border-slate-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
};
export default Explore;

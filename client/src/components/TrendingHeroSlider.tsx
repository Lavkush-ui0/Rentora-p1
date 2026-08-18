import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, Heart, ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { getImageUrl } from '../utils/imageUrl';

interface SlideItem {
  id: string;
  title: string;
  category: string;
  price: number;
  priceUnit: string;
  condition: string;
  gradient: string;
  accentColor: string;
  image: string;
}

const CATEGORY_SLIDE_FALLBACKS: Record<string, string> = {
  'Calculators': 'https://images.unsplash.com/photo-1574607383476-f517f220d398?q=80&w=800&auto=format&fit=crop',
  'Books': 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=800&auto=format&fit=crop',
  'Books & Study Material': 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=800&auto=format&fit=crop',
  'Lab Gear': 'https://images.unsplash.com/photo-1581093588401-fbb62a02f120?q=80&w=800&auto=format&fit=crop',
  'Electronics': 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=800&auto=format&fit=crop',
  'Electronics & Technical': 'https://images.unsplash.com/photo-1574607383476-f517f220d398?q=80&w=800&auto=format&fit=crop',
  'Clothing & Accessories': 'https://images.unsplash.com/photo-1581093588401-fbb62a02f120?q=80&w=800&auto=format&fit=crop',
  'Sports Equipment': 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=800&auto=format&fit=crop',
  'Gaming': 'https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?q=80&w=800&auto=format&fit=crop',
};

const DEFAULT_SLIDE_GRADIENTS = [
  'linear-gradient(135deg, #14b8a6 0%, #0d9488 60%, #0f766e 100%)',
  'linear-gradient(135deg, #9E1B1B 0%, #b91c1c 60%, #7f1d1d 100%)',
  'linear-gradient(135deg, #7c3aed 0%, #6d28d9 60%, #4c1d95 100%)',
  'linear-gradient(135deg, #d97706 0%, #b45309 60%, #92400e 100%)',
];

const CONDITION_COLORS: Record<string, string> = {
  'BRAND NEW': 'bg-emerald-500',
  'NEW': 'bg-emerald-500',
  'LIKE NEW': 'bg-teal-500',
  'LIKE_NEW': 'bg-teal-500',
  'EXCELLENT': 'bg-sky-500',
  'GOOD': 'bg-amber-500',
  'FAIR': 'bg-orange-500',
};

interface TrendingHeroSliderProps {
  listings?: any[];
}

const TrendingHeroSlider: React.FC<TrendingHeroSliderProps> = ({ listings = [] }) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [wishlisted, setWishlisted] = useState<Set<number>>(new Set());
  const navigate = useNavigate();

  // Strictly filter only ACTIVE and AVAILABLE listings
  const activeListings = Array.isArray(listings)
    ? listings.filter(l => l && l._id && l.status === 'ACTIVE' && l.availability !== false)
    : [];

  // Map real active listings to slides
  const slides: SlideItem[] = activeListings.length > 0
    ? activeListings.slice(0, 6).map((l, i) => {
        const catName = typeof l.category === 'object' ? l.category?.name : (l.category || 'Campus Gear');
        const fallbackImg = CATEGORY_SLIDE_FALLBACKS[catName] || 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?q=80&w=800&auto=format&fit=crop';
        const rawImg = l.images && l.images.length > 0 ? l.images[0] : '';
        const displayImg = rawImg?.trim() ? getImageUrl(rawImg, fallbackImg) : fallbackImg;

        return {
          id: l._id,
          title: l.title,
          category: catName,
          price: l.rentalPrice ?? l.price ?? 20,
          priceUnit: (l.priceUnit || 'day').toLowerCase(),
          condition: (l.condition || 'GOOD').replace('_', ' '),
          gradient: DEFAULT_SLIDE_GRADIENTS[i % DEFAULT_SLIDE_GRADIENTS.length],
          accentColor: '#5eead4',
          image: displayImg,
        };
      })
    : [
        {
          id: 'casio-fx',
          title: 'Casio Scientific Calculator fx-991EX',
          category: 'Calculators',
          price: 20,
          priceUnit: 'week',
          condition: 'LIKE NEW',
          gradient: DEFAULT_SLIDE_GRADIENTS[0],
          accentColor: '#5eead4',
          image: 'https://images.unsplash.com/photo-1574607383476-f517f220d398?q=80&w=800&auto=format&fit=crop',
        },
        {
          id: 'dsa-cormen',
          title: 'Introduction to Algorithms (Cormen)',
          category: 'Books',
          price: 10,
          priceUnit: 'day',
          condition: 'GOOD',
          gradient: DEFAULT_SLIDE_GRADIENTS[1],
          accentColor: '#fca5a5',
          image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=800&auto=format&fit=crop',
        },
        {
          id: 'chemistry-lab-coat',
          title: 'NIET Chemistry Lab Coat (Medium)',
          category: 'Clothing',
          price: 5,
          priceUnit: 'day',
          condition: 'GOOD',
          gradient: DEFAULT_SLIDE_GRADIENTS[2],
          accentColor: '#c4b5fd',
          image: 'https://images.unsplash.com/photo-1581093588401-fbb62a02f120?q=80&w=800&auto=format&fit=crop',
        },
      ];

  // Auto-advance
  useEffect(() => {
    const t = setInterval(() => setActiveIdx(i => (i + 1) % slides.length), 4500);
    return () => clearInterval(t);
  }, [slides.length]);

  const prev = () => setActiveIdx(i => (i - 1 + slides.length) % slides.length);
  const next = () => setActiveIdx(i => (i + 1) % slides.length);
  const toggleWishlist = (idx: number) => setWishlisted(prev => {
    const next = new Set(prev);
    next.has(idx) ? next.delete(idx) : next.add(idx);
    return next;
  });

  const getCardStyle = (offset: number) => {
    if (offset === 0) return 'z-30 scale-100 rotate-0 translate-x-0 opacity-100 shadow-2xl';
    if (offset === -1 || offset === slides.length - 1) return 'z-10 scale-[0.88] -rotate-6 -translate-x-[68px] opacity-60 pointer-events-none';
    if (offset === 1 || offset === -(slides.length - 1)) return 'z-10 scale-[0.88] rotate-6 translate-x-[68px] opacity-60 pointer-events-none';
    return 'z-0 scale-[0.78] opacity-0 pointer-events-none';
  };

  return (
    <div className="relative flex flex-col gap-5">
      {/* Header Pill */}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/50">
          <Zap size={10} fill="currentColor" /> Premium Campus Collections
        </span>
      </div>
      <h2 className="font-display font-black text-xl text-slate-900 dark:text-slate-100 tracking-tight -mt-1">
        Best Deals!
      </h2>

      {/* 3D Stage */}
      <div className="perspective-stage relative h-[360px] flex items-center justify-center overflow-visible">
        <div className="relative w-[240px] h-[320px]">
          {slides.map((slide, idx) => {
            const offset = (idx - activeIdx + slides.length) % slides.length;
            const normalizedOffset = offset > slides.length / 2 ? offset - slides.length : offset;

            return (
              <div
                key={slide.id}
                className={`absolute inset-0 rounded-[28px] overflow-hidden transition-all duration-500 ease-spring cursor-pointer border border-white/15 dark:border-slate-700/50 ${getCardStyle(normalizedOffset)}`}
                style={{ background: slide.gradient }}
                onClick={() => {
                  if (normalizedOffset !== 0) {
                    setActiveIdx(idx);
                  } else {
                    navigate(`/listing/${slide.id}`);
                  }
                }}
              >
                {/* Background Product Image */}
                {slide.image && (
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                    onError={(e) => {
                      const catName = slide.category;
                      const fallback = CATEGORY_SLIDE_FALLBACKS[catName] || 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?q=80&w=800&auto=format&fit=crop';
                      if ((e.target as HTMLImageElement).src !== fallback) {
                        (e.target as HTMLImageElement).src = fallback;
                      }
                    }}
                  />
                )}

                {/* Dark Vignette / Gradient Overlay */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.45) 0%, rgba(15, 23, 42, 0.15) 40%, rgba(15, 23, 42, 0.88) 80%, rgba(15, 23, 42, 0.96) 100%)',
                  }}
                />
                {/* Condition Chip */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                  <span className={`text-[9px] font-black uppercase tracking-wider text-white px-2.5 py-1 rounded-full shadow-sm ${CONDITION_COLORS[slide.condition] || 'bg-slate-600'}`}>
                    {slide.condition}
                  </span>
                  {normalizedOffset === 0 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleWishlist(idx); }}
                      className="p-1.5 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60 transition-all border border-white/20"
                    >
                      <Heart
                        size={14}
                        fill={wishlisted.has(idx) ? '#ef4444' : 'none'}
                        color={wishlisted.has(idx) ? '#ef4444' : 'white'}
                      />
                    </button>
                  )}
                </div>

                {/* Dark glass bottom tray */}
                {normalizedOffset === 0 && (
                  <div
                    className="absolute bottom-0 left-0 right-0 p-4 z-10"
                  >
                    <p className="text-[10px] font-black uppercase tracking-wider mb-1 text-teal-300 drop-shadow-sm">
                      {slide.category}
                    </p>
                    <p className="text-white font-display font-bold text-sm leading-tight line-clamp-2 mb-3 drop-shadow">
                      {slide.title}
                    </p>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-white font-black font-display text-lg drop-shadow">₹{slide.price}</span>
                        <span className="text-white/80 text-[10px] font-semibold ml-1">/{slide.priceUnit}</span>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          to={`/listing/${slide.id}`}
                          onClick={e => e.stopPropagation()}
                          className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-white bg-white/20 hover:bg-white/35 backdrop-blur-md px-3 py-1.5 rounded-full transition-all border border-white/30 shadow-sm"
                        >
                          <Eye size={10} /> View
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={prev}
          className="h-9 w-9 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 hover:border-[#22716E] hover:text-[#22716E] transition-all shadow-sm"
        >
          <ChevronLeft size={16} />
        </button>

        {/* Pill indicators */}
        <div className="flex gap-1.5">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIdx(idx)}
              className="transition-all duration-300 rounded-full"
              style={{
                width: idx === activeIdx ? 28 : 6,
                height: 6,
                background: idx === activeIdx ? '#22716E' : '#CBD5E1',
              }}
            />
          ))}
        </div>

        <button
          onClick={next}
          className="h-9 w-9 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 hover:border-[#22716E] hover:text-[#22716E] transition-all shadow-sm"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default TrendingHeroSlider;

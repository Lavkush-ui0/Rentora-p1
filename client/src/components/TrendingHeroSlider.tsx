import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Heart, ChevronLeft, ChevronRight, Zap } from 'lucide-react';

interface SlideItem {
  id: string;
  title: string;
  category: string;
  price: number;
  priceUnit: string;
  condition: string;
  gradient: string;
  accentColor: string;
  image?: string;
}

const MOCK_SLIDES: SlideItem[] = [
  {
    id: '1',
    title: 'Casio FX-991ES Plus Scientific Calculator',
    category: 'Calculators',
    price: 30,
    priceUnit: 'day',
    condition: 'BRAND NEW',
    gradient: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 60%, #0f766e 100%)',
    accentColor: '#5eead4',
  },
  {
    id: '2',
    title: 'Engineering Maths — GATE Reference Set',
    category: 'Books',
    price: 15,
    priceUnit: 'day',
    condition: 'LIKE NEW',
    gradient: 'linear-gradient(135deg, #9E1B1B 0%, #b91c1c 60%, #7f1d1d 100%)',
    accentColor: '#fca5a5',
  },
  {
    id: '3',
    title: 'Lab Breadboard + Component Kit',
    category: 'Lab Gear',
    price: 20,
    priceUnit: 'day',
    condition: 'GOOD',
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 60%, #4c1d95 100%)',
    accentColor: '#c4b5fd',
  },
  {
    id: '4',
    title: 'Raspberry Pi 4 — 4GB RAM',
    category: 'Electronics',
    price: 60,
    priceUnit: 'day',
    condition: 'EXCELLENT',
    gradient: 'linear-gradient(135deg, #d97706 0%, #b45309 60%, #92400e 100%)',
    accentColor: '#fcd34d',
  },
];

const CONDITION_COLORS: Record<string, string> = {
  'BRAND NEW': 'bg-emerald-500',
  'LIKE NEW': 'bg-teal-500',
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

  // Map real listings to slides or fall back to mocks
  const slides: SlideItem[] = listings.length >= 3
    ? listings.slice(0, 4).map((l, i) => ({
        id: l._id,
        title: l.title,
        category: typeof l.category === 'object' ? l.category?.name : l.category,
        price: l.rentalPrice ?? l.price ?? 20,
        priceUnit: l.priceUnit || 'day',
        condition: l.condition || 'GOOD',
        gradient: MOCK_SLIDES[i % MOCK_SLIDES.length].gradient,
        accentColor: MOCK_SLIDES[i % MOCK_SLIDES.length].accentColor,
        image: l.images?.[0],
      }))
    : MOCK_SLIDES;

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
    if (offset === 0) return 'z-30 scale-100 rotate-0 translate-x-0 opacity-100';
    if (offset === -1 || offset === slides.length - 1) return 'z-10 scale-[0.88] -rotate-6 -translate-x-[68px] opacity-50 pointer-events-none';
    if (offset === 1 || offset === -(slides.length - 1)) return 'z-10 scale-[0.88] rotate-6 translate-x-[68px] opacity-50 pointer-events-none';
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
                className={`absolute inset-0 rounded-[28px] transition-all duration-500 ease-spring cursor-pointer ${getCardStyle(normalizedOffset)}`}
                style={{ background: slide.gradient }}
                onClick={() => {
                  if (normalizedOffset !== 0) setActiveIdx(idx);
                }}
              >
                {/* Condition Chip */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                  <span className={`text-[9px] font-black uppercase tracking-wider text-white px-2.5 py-1 rounded-full ${CONDITION_COLORS[slide.condition] || 'bg-slate-600'}`}>
                    {slide.condition}
                  </span>
                  {normalizedOffset === 0 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleWishlist(idx); }}
                      className="p-1.5 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 transition-all"
                    >
                      <Heart
                        size={14}
                        fill={wishlisted.has(idx) ? '#ef4444' : 'none'}
                        color={wishlisted.has(idx) ? '#ef4444' : 'white'}
                      />
                    </button>
                  )}
                </div>

                {/* Center illustration */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className="w-24 h-24 rounded-2xl flex items-center justify-center text-4xl shadow-2xl"
                    style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.3)' }}
                  >
                    {slide.category === 'Calculators' && '🧮'}
                    {slide.category === 'Books' && '📚'}
                    {slide.category === 'Lab Gear' && '🔬'}
                    {slide.category === 'Electronics' && '💻'}
                    {!['Calculators','Books','Lab Gear','Electronics'].includes(slide.category) && '📦'}
                  </div>
                </div>

                {/* Dark glass bottom tray */}
                {normalizedOffset === 0 && (
                  <div
                    className="absolute bottom-0 left-0 right-0 rounded-b-[28px] p-4"
                    style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)' }}
                  >
                    <p className="text-[9px] font-black uppercase tracking-wider mb-1" style={{ color: slide.accentColor }}>
                      {slide.category}
                    </p>
                    <p className="text-white font-display font-bold text-sm leading-tight line-clamp-2 mb-3">
                      {slide.title}
                    </p>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-white font-black font-display text-lg">₹{slide.price}</span>
                        <span className="text-white/60 text-[10px] font-medium ml-1">/{slide.priceUnit}</span>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          to={`/listing/${slide.id}`}
                          onClick={e => e.stopPropagation()}
                          className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-white bg-white/20 hover:bg-white/30 backdrop-blur-md px-3 py-1.5 rounded-full transition-all"
                        >
                          <Eye size={10} /> Quick View
                        </Link>
                        <Link
                          to={`/listing/${slide.id}`}
                          onClick={e => e.stopPropagation()}
                          className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-white bg-white/25 hover:bg-white/35 backdrop-blur-md px-3 py-1.5 rounded-full transition-all border border-white/30"
                        >
                          Rent Now
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

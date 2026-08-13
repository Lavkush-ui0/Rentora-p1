import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ShoppingBag, Eye, Heart, Check, Sparkles } from 'lucide-react';
import { useWishlist, ListingSummary } from '../context/WishlistContext';
import { getImageUrl } from '../utils/imageUrl';

interface CoverflowSliderProps {
  listings: any[];
}

const cardGradients = [
  'from-rose-500 to-red-600',
  'from-emerald-500 to-teal-600',
  'from-pink-400 to-rose-500',
  'from-indigo-500 to-purple-600',
  'from-cyan-500 to-blue-600',
  'from-amber-400 to-orange-500',
  'from-teal-500 to-emerald-600',
  'from-fuchsia-500 to-pink-600',
];

const conditionLabels = {
  NEW: 'Brand New',
  LIKE_NEW: 'Like New',
  GOOD: 'Good Condition',
  FAIR: 'Fair / Usable',
};

export const CoverflowSlider: React.FC<CoverflowSliderProps> = ({ listings }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const { isInWishlist, toggleWishlist, isInCart, addToCart, removeFromCart } = useWishlist();
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Dragging / Swipe state
  const startXRef = useRef<number | null>(null);
  const isDragging = useRef(false);
  const dragThreshold = 40; // minimum pixels to trigger a slide

  // Limit to at most 7-9 items for the coverflow display
  const items = listings.slice(0, 8);

  useEffect(() => {
    if (items.length <= 1 || isHovered) {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
      return;
    }

    autoPlayRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % items.length);
    }, 4500);

    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [items.length, isHovered]);

  if (!items.length) return null;

  const handlePrev = () => {
    setActiveIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    isDragging.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startXRef.current === null) return;
    const currentX = e.touches[0].clientX;
    const diff = startXRef.current - currentX;
    if (Math.abs(diff) > dragThreshold) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
      startXRef.current = null; // Synchronous reset to prevent multiple triggers in one gesture
      isDragging.current = true;
    }
  };

  const handleTouchEnd = () => {
    startXRef.current = null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    startXRef.current = e.clientX;
    isDragging.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (startXRef.current === null) return;
    const currentX = e.clientX;
    const diff = startXRef.current - currentX;
    if (Math.abs(diff) > dragThreshold) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
      startXRef.current = null; // Synchronous reset to prevent multiple triggers in one gesture
      isDragging.current = true;
    }
  };

  const handleMouseUp = () => {
    startXRef.current = null;
  };

  const handleCardClick = (index: number) => {
    if (isDragging.current) {
      isDragging.current = false;
      return;
    }
    setActiveIndex(index);
  };

  const handleCartClick = (e: React.MouseEvent, item: any) => {
    e.preventDefault();
    e.stopPropagation();
    if (isInCart(item._id)) {
      removeFromCart(item._id);
    } else {
      addToCart(item as ListingSummary);
    }
  };

  return (
    <div 
      className="relative w-full py-10 px-4 md:px-10 overflow-hidden bg-gradient-to-b from-slate-950/80 to-slate-900/40 dark:from-slate-950/90 dark:to-slate-900/60 rounded-[3rem] border border-slate-800/50 shadow-2xl flex flex-col items-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Decorative Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-primary-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header */}
      <div className="text-center mb-8 relative z-10">
        <div className="inline-flex items-center space-x-1.5 bg-primary-500/10 dark:bg-primary-400/10 text-primary-600 dark:text-primary-400 px-3 py-1 rounded-full text-xs font-bold mb-3 border border-primary-500/20">
          <Sparkles className="h-3 w-3" />
          <span>Premium Campus Collections</span>
        </div>
        <h2 className="text-2xl md:text-4xl font-black font-outfit text-white leading-tight">
          Trending Now
        </h2>
        <p className="text-slate-400 text-xs md:text-sm mt-1 max-w-lg mx-auto">
          Swipe, browse, and rent high-demand campus gear directly from NIET classmates.
        </p>
      </div>

      {/* 3D Coverflow Container with preserve-3d enabled to align pointer event projection */}
      <div 
        className="relative w-full max-w-5xl h-[380px] md:h-[430px] flex items-center justify-center perspective-[1200px] preserve-3d"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDragStart={(e) => e.preventDefault()} // Disable native image/text dragging
      >
        {items.map((item, index) => {
          const isCenter = index === activeIndex;
          const diff = index - activeIndex;
          
          // Layout variables for the 3D calculation
          const absDiff = Math.abs(diff);
          const zTranslation = -absDiff * 90;
          const rotation = diff * 28;
          // Dynamically adjust x translation based on screen size (using responsive values)
          const isMobile = window.innerWidth < 640;
          const baseStep = isMobile ? 50 : 110;
          const xTranslation = diff * baseStep + (diff > 0 ? 30 : diff < 0 ? -30 : 0);
          
          const gradient = cardGradients[index % cardGradients.length];
          const displayImage = getImageUrl(item.images?.[0]);
          const inCart = isInCart(item._id);

          return (
            <div
              key={item._id}
              style={{
                transform: `translateX(${xTranslation}px) translateZ(${zTranslation}px) rotateY(${-rotation}deg) scale(${isCenter ? 1.05 : 0.88})`,
                zIndex: 10 - absDiff,
                opacity: absDiff > 2 ? 0 : absDiff === 2 ? 0.35 : 1,
                cursor: isCenter ? 'default' : 'pointer',
              }}
              className={`absolute w-[240px] md:w-[280px] h-[340px] md:h-[390px] rounded-[2rem] p-5 shadow-2xl flex flex-col justify-between transition-all duration-500 ease-out preserve-3d group ${
                isCenter ? 'ring-4 ring-primary-500 shadow-primary-500/20' : 'hover:opacity-90 select-none'
              } bg-gradient-to-br ${gradient} text-white`}
            >
              {/* Click overlay for non-active cards to prevent child elements from hijacking clicks */}
              {!isCenter && (
                <div 
                  className="absolute inset-0 z-30 rounded-[2rem] cursor-pointer" 
                  onClick={() => handleCardClick(index)}
                />
              )}

              {/* Card Top: Tag & Saved Button */}
              <div className="flex justify-between items-center relative z-10">
                <span className="bg-black/35 backdrop-blur-md text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full border border-white/10">
                  {conditionLabels[item.condition as keyof typeof conditionLabels] || 'Good'}
                </span>
                
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleWishlist(item);
                  }}
                  className={`p-2 rounded-full backdrop-blur-md transition-all active:scale-95 ${
                    isInWishlist(item._id) 
                      ? 'bg-red-500 text-white border border-red-500/30' 
                      : 'bg-black/20 hover:bg-black/40 text-white/90 hover:text-white border border-white/10'
                  }`}
                >
                  <Heart className={`h-3.5 w-3.5 ${isInWishlist(item._id) ? 'fill-current' : ''}`} />
                </button>
              </div>

              {/* Card Center: Floating Product Image */}
              <div className="flex-1 flex items-center justify-center my-3 relative">
                {/* Floating Shadow/Glow behind Image */}
                <div className="absolute w-24 h-24 rounded-full bg-white/20 blur-xl"></div>
                <img
                  src={displayImage}
                  alt={item.title}
                  className="max-h-[140px] md:max-h-[170px] w-auto max-w-[85%] object-contain rounded-2xl drop-shadow-[0_20px_25px_rgba(0,0,0,0.45)] group-hover:scale-105 transition-transform duration-300 pointer-events-none"
                  draggable="false"
                />
              </div>

              {/* Card Bottom Panel */}
              <div className="relative z-10 bg-black/40 dark:bg-black/60 backdrop-blur-xl rounded-2xl p-3 border border-white/10 space-y-2">
                <div className="flex justify-between items-start gap-1">
                  <h3 className="font-outfit font-black text-xs md:text-sm tracking-tight leading-tight line-clamp-1 flex-1">
                    {item.title}
                  </h3>
                  <div className="text-right">
                    <span className="text-xs font-black block leading-none">₹{item.rentalPrice}</span>
                    <span className="text-[8px] opacity-75 capitalize">/{item.priceUnit?.toLowerCase()}</span>
                  </div>
                </div>

                {/* Info and Actions on Center Card */}
                {isCenter && (
                  <div className="flex gap-1.5 pt-1 animate-fadeIn">
                    <button
                      onClick={(e) => handleCartClick(e, item)}
                      className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-[10px] font-black tracking-wide uppercase transition-all shadow-sm ${
                        inCart
                          ? 'bg-white text-slate-900 hover:bg-slate-100'
                          : 'bg-primary-600 hover:bg-primary-500 text-white hover:shadow-primary-500/25'
                      }`}
                    >
                      {inCart ? (
                        <>
                          <Check className="h-3 w-3 stroke-[3]" />
                          <span>In Bag</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="h-3 w-3" />
                          <span>Rent Now</span>
                        </>
                      )}
                    </button>
                    <Link
                      to={`/listing/${item._id}`}
                      className="bg-white/10 hover:bg-white/20 border border-white/10 text-white p-1.5 rounded-xl flex items-center justify-center transition-all"
                      title="View Details"
                    >
                      <Eye className="h-3 w-3" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center space-x-6 mt-4 relative z-10">
        <button
          onClick={handlePrev}
          className="p-3 rounded-full bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-white/90 hover:text-white transition-all shadow-lg active:scale-90"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {/* Carousel Indicators */}
        <div className="flex space-x-2">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => handleCardClick(i)}
              className={`h-1.5 transition-all duration-300 rounded-full ${
                i === activeIndex ? 'w-6 bg-primary-500' : 'w-2 bg-slate-600 hover:bg-slate-500'
              }`}
            ></button>
          ))}
        </div>

        <button
          onClick={handleNext}
          className="p-3 rounded-full bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-white/90 hover:text-white transition-all shadow-lg active:scale-90"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default CoverflowSlider;

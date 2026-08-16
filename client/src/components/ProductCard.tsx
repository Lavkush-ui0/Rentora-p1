import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Heart, MapPin } from 'lucide-react';
import { useWishlist, ListingSummary } from '../context/WishlistContext';
import { getImageUrl } from '../utils/imageUrl';
import { ArtworkTile } from './RentoraBrand';

interface ProductCardProps {
  listing: {
    _id: string;
    title: string;
    images: string[];
    category?: string | Record<string, any>;
    condition: 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR';
    rentalPrice: number;
    priceUnit: 'DAY' | 'WEEK' | 'MONTH';
    securityDeposit: number;
    location?: string;
    owner: {
      _id: string;
      fullName: string;
      avatar: string;
      ratingAverage?: number;
    };
  };
}

const CONDITION_STYLES: Record<string, string> = {
  NEW: 'bg-emerald-500 text-white',
  LIKE_NEW: 'bg-sky-500 text-white',
  GOOD: 'bg-amber-500 text-white',
  FAIR: 'bg-orange-500 text-white',
};

const CONDITION_LABELS: Record<string, string> = {
  NEW: 'Brand New',
  LIKE_NEW: 'Like New',
  GOOD: 'Good',
  FAIR: 'Fair',
};

const THEMES = ['mint', 'peach', 'lavender', 'blue', 'sand', 'rose'] as const;

export const ProductCard: React.FC<ProductCardProps> = ({ listing }) => {
  const {
    _id, title, images,
    category: rawCategory = 'Gear',
    condition, rentalPrice, priceUnit, securityDeposit, owner, location
  } = listing;
  const { isInWishlist, toggleWishlist } = useWishlist();

  // Normalise category — API may return populated object
  const category = typeof rawCategory === 'object' && rawCategory !== null
    ? (rawCategory as any).name || 'Gear'
    : String(rawCategory || 'Gear');

  const isFavorited = isInWishlist(_id);

  // Use ArtworkTile when there's no real uploaded image
  const hasImage = images && images.length > 0
    && !images[0].includes('mock')
    && !images[0].includes('picsum')
    && !images[0].includes('placeholder');

  const displayImage = getImageUrl(images?.[0]);
  const themeIndex = (title.length + (title.charCodeAt(0) || 0)) % THEMES.length;
  const selectedTheme = THEMES[themeIndex];

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(listing as ListingSummary);
  };

  // Extract short plot label
  const plotLabel = location?.replace('NIET ', '') || '';

  return (
    <article className="group flex flex-col bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 card-lift transition-all duration-300 relative">

      {/* Thumbnail / Artwork */}
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <Link to={`/listing/${_id}`} className="block w-full h-full" tabIndex={-1}>
          {hasImage ? (
            <img
              src={displayImage}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <ArtworkTile
              category={category}
              theme={selectedTheme}
              title={title}
              location={plotLabel}
              className="w-full h-full rounded-none"
            />
          )}
        </Link>

        {/* Condition badge */}
        <span className={`absolute top-3 left-3 text-[9px] font-black px-2 py-0.5 rounded-full pointer-events-none shadow-sm ${CONDITION_STYLES[condition] || CONDITION_STYLES.GOOD} font-display uppercase tracking-wider`}>
          {CONDITION_LABELS[condition] || 'Good'}
        </span>

        {/* Wishlist */}
        <button
          type="button"
          onClick={handleWishlistClick}
          aria-label={isFavorited ? 'Remove from wishlist' : 'Save to wishlist'}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all shadow-sm ${
            isFavorited
              ? 'bg-red-500 text-white'
              : 'bg-white/85 dark:bg-slate-900/85 text-slate-500 hover:text-red-500 hover:bg-white dark:hover:bg-slate-800'
          }`}
        >
          <Heart size={13} fill={isFavorited ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Card Body */}
      <div className="flex-1 flex flex-col p-4 gap-3">
        <Link to={`/listing/${_id}`}>
          <h3 className="font-display font-black text-slate-900 dark:text-white group-hover:text-[#9E1B1B] transition-colors text-sm tracking-tight line-clamp-1 leading-snug">
            {title}
          </h3>
        </Link>

        {/* Deposit + Plot */}
        <div className="flex items-center gap-3 text-[10px] text-slate-400 dark:text-slate-500 font-medium">
          <span>Deposit: <strong className="text-slate-600 dark:text-slate-300">₹{securityDeposit || 0}</strong></span>
          {plotLabel && (
            <span className="flex items-center gap-0.5 text-[#22716E] dark:text-[#5FD2CA] font-bold">
              <MapPin size={9} /> {plotLabel}
            </span>
          )}
        </div>

        {/* Footer: Owner + Price */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 mt-auto">
          <Link to={`/profile/${owner?._id}`} className="flex items-center gap-2">
            <img
              src={owner?.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${owner?._id}`}
              alt={owner?.fullName}
              className="h-7 w-7 rounded-full object-cover border border-slate-100 dark:border-slate-800"
            />
            <div>
              <p className="text-[10px] font-black text-slate-800 dark:text-slate-200 truncate max-w-[72px]">
                {owner?.fullName?.split(' ')[0] ?? 'Student'}
              </p>
              <div className="flex items-center gap-0.5 text-[9px] text-amber-500 font-bold">
                <Star size={9} fill="currentColor" />
                {(owner?.ratingAverage ?? 5).toFixed(1)}
              </div>
            </div>
          </Link>

          <div className="text-right">
            <p className="font-display font-black text-[#9E1B1B] dark:text-[#E8AEAE] text-sm leading-none">
              ₹{rentalPrice}
            </p>
            <p className="text-[9px] text-slate-400 font-medium mt-0.5 capitalize">
              / {(priceUnit || 'day').toLowerCase()}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;

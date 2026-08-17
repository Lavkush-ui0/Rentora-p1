import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Heart, MapPin } from 'lucide-react';
import { useWishlist, ListingSummary } from '../context/WishlistContext';
import { getImageUrl, getAvatarUrl } from '../utils/imageUrl';

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

  // Category based high-resolution fallback photos
  const CATEGORY_FALLBACKS: Record<string, string> = {
    'Books & Study Material': 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=600&auto=format&fit=crop',
    'Electronics & Technical': 'https://images.unsplash.com/photo-1574607383476-f517f220d398?q=80&w=600&auto=format&fit=crop',
    'Clothing & Accessories': 'https://images.unsplash.com/photo-1581093588401-fbb62a02f120?q=80&w=600&auto=format&fit=crop',
    'Sports Equipment': 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=600&auto=format&fit=crop',
    'Gaming': 'https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?q=80&w=600&auto=format&fit=crop',
    'Other': 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?q=80&w=600&auto=format&fit=crop',
  };

  const defaultCategoryImg = CATEGORY_FALLBACKS[category] || 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?q=80&w=600&auto=format&fit=crop';
  const displayImage = images && images.length > 0 && images[0]?.trim()
    ? getImageUrl(images[0], defaultCategoryImg)
    : defaultCategoryImg;

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(listing as ListingSummary);
  };

  // Extract short plot label
  const plotLabel = location?.replace('NIET ', '') || '';

  return (
    <article className="group flex flex-col bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 card-lift transition-all duration-300 relative">

      {/* Thumbnail / Real Product Photo */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
        <Link to={`/listing/${_id}`} className="block w-full h-full" tabIndex={-1}>
          <img
            src={displayImage}
            alt={title}
            onError={(e) => {
              // Fallback to category photo if remote image fails
              (e.target as HTMLImageElement).src = defaultCategoryImg;
            }}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
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
              src={getAvatarUrl(owner?.avatar, owner?.fullName)}
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

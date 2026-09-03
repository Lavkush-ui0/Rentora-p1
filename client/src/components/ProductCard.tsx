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
  if (!listing) return null;

  const _id = listing._id || (listing as any).id || '';
  const title = listing.title || 'Product';
  const images = Array.isArray(listing.images) ? listing.images : [];
  const condition = listing.condition || 'GOOD';
  const rentalPrice = Number(listing.rentalPrice) || 0;
  const priceUnit = listing.priceUnit || 'DAY';
  const securityDeposit = Number(listing.securityDeposit) || 0;
  const owner = listing.owner || { _id: '', fullName: 'Student', avatar: '', ratingAverage: 5 };
  const location = listing.location || '';

  const { isInWishlist, toggleWishlist } = useWishlist();

  const isFavorited = _id ? isInWishlist(_id) : false;

  const fallbackImg = '/rentora-logo.png';
  const displayImage = images && images.length > 0 && images[0]?.trim()
    ? getImageUrl(images[0], fallbackImg)
    : fallbackImg;

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
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
        <Link to={`/listing/${_id}`} className="block w-full h-full" tabIndex={-1}>
          <img
            src={displayImage}
            alt={title}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.src = fallbackImg;
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
          <Link to={owner?._id ? `/profile/${owner._id}` : '#'} className="flex items-center gap-2">
            <img
              src={getAvatarUrl(owner?.avatar, owner?.fullName || 'Student')}
              alt={owner?.fullName || 'Student'}
              className="h-7 w-7 rounded-full object-cover border border-slate-100 dark:border-slate-800"
            />
            <div>
              <p className="text-[10px] font-black text-slate-800 dark:text-slate-200 truncate max-w-[72px]">
                {owner?.fullName ? owner.fullName.split(' ')[0] : 'Student'}
              </p>
              <div className="flex items-center gap-0.5 text-[9px] text-amber-500 font-bold">
                <Star size={9} fill="currentColor" />
                {(Number(owner?.ratingAverage) || 5).toFixed(1)}
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

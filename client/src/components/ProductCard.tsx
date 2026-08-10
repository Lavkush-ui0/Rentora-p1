import React from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';

interface ProductCardProps {
  listing: {
    _id: string;
    title: string;
    images: string[];
    condition: 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR';
    rentalPrice: number;
    priceUnit: 'DAY' | 'WEEK' | 'MONTH';
    securityDeposit: number;
    owner: {
      _id: string;
      fullName: string;
      avatar: string;
      ratingAverage: number;
    };
  };
}

const conditionColors = {
  NEW: 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400 border border-green-200 dark:border-green-800',
  LIKE_NEW: 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800',
  GOOD: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800',
  FAIR: 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border border-red-200 dark:border-red-800',
};

const conditionLabels = {
  NEW: 'Brand New',
  LIKE_NEW: 'Like New',
  GOOD: 'Good Condition',
  FAIR: 'Fair / Usable',
};

export const ProductCard: React.FC<ProductCardProps> = ({ listing }) => {
  const { _id, title, images, condition, rentalPrice, priceUnit, securityDeposit, owner } = listing;

  const displayImage = images[0] || 'https://picsum.photos/600/400';

  return (
    <div className="group flex flex-col bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-gray-100 dark:border-slate-800 hover:shadow-xl transition-all duration-300">
      
      {/* Product Image & Badges */}
      <Link to={`/listing/${_id}`} className="relative block aspect-[4/3] w-full overflow-hidden bg-gray-100 dark:bg-slate-800">
        <img
          src={displayImage}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <span className={`absolute top-3 left-3 text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm ${conditionColors[condition]}`}>
          {conditionLabels[condition]}
        </span>
      </Link>

      {/* Product Details */}
      <div className="flex-1 p-4 flex flex-col justify-between">
        
        <div>
          <div className="flex justify-between items-start mb-1.5">
            <Link to={`/listing/${_id}`} className="block">
              <h3 className="font-outfit font-bold text-gray-900 dark:text-gray-100 group-hover:text-primary-600 transition-colors text-base line-clamp-1 leading-snug">
                {title}
              </h3>
            </Link>
          </div>

          <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 mb-4">
            <span className="font-medium">Security Deposit:</span>
            <span className="font-bold text-gray-700 dark:text-gray-300">₹{securityDeposit}</span>
          </div>
        </div>

        {/* Owner Details & Pricing */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-50 dark:border-slate-800/80">
          
          {/* Owner Avatar & Name */}
          <Link to={`/profile/${owner._id}`} className="flex items-center space-x-2">
            <img
              src={owner.avatar}
              alt={owner.fullName}
              className="h-8 w-8 rounded-full border border-gray-100 dark:border-slate-800 object-cover"
            />
            <div className="text-left">
              <p className="text-[11px] font-bold text-gray-800 dark:text-gray-200 leading-tight truncate max-w-[80px]">
                {owner.fullName}
              </p>
              <div className="flex items-center text-[10px] text-amber-500 font-bold leading-none mt-0.5">
                <Star className="h-2.5 w-2.5 fill-current mr-0.5" />
                <span>{(owner.ratingAverage ?? 0).toFixed(1)}</span>
              </div>
            </div>
          </Link>

          {/* Pricing */}
          <div className="text-right">
            <p className="text-sm font-extrabold text-primary-600 dark:text-primary-400 leading-none">
              ₹{rentalPrice}
            </p>
            <p className="text-[10px] text-gray-400 font-medium capitalize mt-0.5">
              per {priceUnit.toLowerCase()}
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};

export default ProductCard;

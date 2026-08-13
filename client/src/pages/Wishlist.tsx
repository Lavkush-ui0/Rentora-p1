import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { Heart, ShoppingBag, Trash2, ArrowRight, Calendar, ArrowLeft } from 'lucide-react';
import ProductCard from '../components/ProductCard';

export const Wishlist: React.FC = () => {
  const { wishlist, clearWishlist, cart, clearCart, removeFromCart } = useWishlist();
  const [activeTab, setActiveTab] = useState<'wishlist' | 'cart'>('wishlist');

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-sm text-gray-400 dark:text-gray-500 mb-2">
            <Link to="/home" className="hover:text-primary-600 flex items-center gap-1 transition-colors">
              <ArrowLeft className="h-4 w-4" /> Home
            </Link>
            <span>/</span>
            <span className="text-gray-700 dark:text-gray-300 font-medium">Saved Items</span>
          </div>
          <h1 className="text-3xl font-black font-outfit text-gray-900 dark:text-gray-100 flex items-center gap-3">
            {activeTab === 'wishlist' ? (
              <>
                <span className="p-2 rounded-2xl bg-red-50 dark:bg-red-950/30 text-red-500">
                  <Heart className="h-6 w-6 fill-current" />
                </span>
                <span>My Wishlist</span>
              </>
            ) : (
              <>
                <span className="p-2 rounded-2xl bg-primary-50 dark:bg-primary-950/30 text-primary-600">
                  <ShoppingBag className="h-6 w-6" />
                </span>
                <span>Rental Cart</span>
              </>
            )}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {activeTab === 'wishlist'
              ? `${wishlist.length} item${wishlist.length === 1 ? '' : 's'} saved for later`
              : `${cart.length} item${cart.length === 1 ? '' : 's'} in your quick rent bag`}
          </p>
        </div>

        {/* Tab Switcher & Clear Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex bg-gray-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-gray-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('wishlist')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'wishlist'
                  ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              <Heart className="h-4 w-4 fill-red-500 text-red-500" />
              <span>Wishlist ({wishlist.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('cart')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'cart'
                  ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              <ShoppingBag className="h-4 w-4 text-primary-600" />
              <span>Cart ({cart.length})</span>
            </button>
          </div>

          {activeTab === 'wishlist' && wishlist.length > 0 && (
            <button
              onClick={clearWishlist}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 border border-red-200 dark:border-red-900/30 transition-all"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear All</span>
            </button>
          )}

          {activeTab === 'cart' && cart.length > 0 && (
            <button
              onClick={clearCart}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 border border-red-200 dark:border-red-900/30 transition-all"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear Cart</span>
            </button>
          )}
        </div>
      </div>

      {/* Content Rendering */}
      {activeTab === 'wishlist' ? (
        wishlist.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {wishlist.map((item) => (
              <ProductCard key={item._id} listing={item as any} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 p-8">
            <div className="h-20 w-20 mx-auto rounded-3xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center text-red-500 mb-4 shadow-sm">
              <Heart className="h-10 w-10 stroke-1" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Your wishlist is empty</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-sm mx-auto">
              Save calculators, lab coats, books, and gadgets you might need later by tapping the heart icon.
            </p>
            <Link
              to="/explore"
              className="mt-6 inline-flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-md transition-all"
            >
              <span>Explore Campus Items</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )
      ) : (
        cart.length > 0 ? (
          <div className="space-y-4 max-w-4xl mx-auto">
            {cart.map((item) => (
              <div
                key={item._id}
                className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-center space-x-4 w-full sm:w-auto">
                  <img
                    src={item.images?.[0] || 'https://picsum.photos/150/150'}
                    alt={item.title}
                    className="h-20 w-20 rounded-2xl object-cover border border-gray-100 dark:border-slate-800 shrink-0"
                  />
                  <div>
                    <Link
                      to={`/listing/${item._id}`}
                      className="font-bold text-base text-gray-900 dark:text-gray-100 hover:text-primary-600 transition-colors line-clamp-1"
                    >
                      {item.title}
                    </Link>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Offered by <span className="font-semibold text-gray-700 dark:text-gray-300">{item.owner?.fullName}</span>
                    </p>
                    <p className="text-sm font-extrabold text-primary-600 dark:text-primary-400 mt-2">
                      ₹{item.rentalPrice} <span className="text-xs font-normal text-gray-400">/ {item.priceUnit?.toLowerCase()}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-slate-800">
                  <button
                    onClick={() => removeFromCart(item._id)}
                    className="p-2.5 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
                    title="Remove from Cart"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                  <Link
                    to={`/listing/${item._id}`}
                    className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all"
                  >
                    <Calendar className="h-4 w-4" />
                    <span>Request Rental</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 p-8">
            <div className="h-20 w-20 mx-auto rounded-3xl bg-primary-50 dark:bg-primary-950/30 flex items-center justify-center text-primary-600 mb-4 shadow-sm">
              <ShoppingBag className="h-10 w-10 stroke-1" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Your rental cart is empty</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-sm mx-auto">
              Add items you want to rent to your bag to request them quickly from other students.
            </p>
            <Link
              to="/explore"
              className="mt-6 inline-flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-md transition-all"
            >
              <span>Browse Marketplace</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )
      )}

    </div>
  );
};

export default Wishlist;

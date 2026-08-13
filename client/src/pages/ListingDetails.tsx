import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { listingService } from '../services/listingService';
import { rentalService } from '../services/rentalService';
import {
  Star, Eye, Repeat, ChevronLeft, ChevronRight,
  Calendar, MessageCircle, Tag, AlertTriangle, Package, User, Share2, Heart, ShoppingBag
} from 'lucide-react';

const conditionColors: Record<string, string> = {
  NEW: 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400',
  LIKE_NEW: 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400',
  GOOD: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
  FAIR: 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400',
};

export const ListingDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { isInWishlist, toggleWishlist, isInCart, addToCart, removeFromCart } = useWishlist();
  const navigate = useNavigate();

  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentImg, setCurrentImg] = useState(0);
  const [requestOpen, setRequestOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [requestError, setRequestError] = useState('');

  useEffect(() => {
    const fetchListing = async () => {
      try {
        await listingService.incrementViewCount(id!);
        const res = await listingService.getListingById(id!);
        if (res.data?.success) setListing(res.data.listing);
      } catch (err) {
        console.error('[ListingDetails] Error:', err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchListing();
  }, [id]);

  const handleRentalRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setRequestError('');
    setSubmitting(true);
    try {
      await rentalService.createRentalRequest({
        listing: listing._id,
        startDate,
        endDate,
        message,
      });
      setRequestOpen(false);
      navigate('/my-rentals');
    } catch (err: any) {
      setRequestError(err.response?.data?.message || 'Failed to send rental request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const isOwner = user && listing?.owner?._id === user.id;
  const isAvailable = listing?.status === 'ACTIVE' && listing?.availability;
  const todayStr = new Date().toISOString().split('T')[0];

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="aspect-[4/3] bg-gray-100 dark:bg-slate-800 rounded-3xl"></div>
          <div className="space-y-4 py-4">
            <div className="h-8 bg-gray-100 dark:bg-slate-800 rounded-full w-3/4"></div>
            <div className="h-4 bg-gray-100 dark:bg-slate-800 rounded-full w-1/2"></div>
            <div className="h-24 bg-gray-100 dark:bg-slate-800 rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="text-center py-24">
        <Package className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
        <h2 className="text-xl font-bold text-gray-700 dark:text-gray-300">Listing Not Found</h2>
        <Link to="/explore" className="mt-4 inline-block text-primary-600 font-semibold">Browse other items</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">

      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-gray-400 dark:text-gray-500">
        <Link to="/explore" className="hover:text-primary-600 transition-colors font-medium">Explore</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-gray-700 dark:text-gray-300 font-semibold truncate">{listing.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Image Gallery */}
        <div className="space-y-3">
          <div className="relative aspect-[4/3] bg-gray-100 dark:bg-slate-800 rounded-3xl overflow-hidden group">
            <img
              src={listing.images[currentImg] || 'https://picsum.photos/600/400'}
              alt={listing.title}
              className="h-full w-full object-cover transition-all duration-500"
            />
            {listing.images.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentImg(i => Math.max(0, i - 1))}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-slate-900/90 p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setCurrentImg(i => Math.min(listing.images.length - 1, i + 1))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-slate-900/90 p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}
            <span className={`absolute top-3 left-3 text-[11px] font-bold px-2.5 py-1 rounded-full ${conditionColors[listing.condition]}`}>
              {listing.condition.replace('_', ' ')}
            </span>
          </div>
          {/* Thumbnails */}
          {listing.images.length > 1 && (
            <div className="flex space-x-2">
              {listing.images.map((img: string, i: number) => (
                <button
                  key={i}
                  onClick={() => setCurrentImg(i)}
                  className={`h-16 w-16 rounded-xl overflow-hidden border-2 transition-all ${i === currentImg ? 'border-primary-500' : 'border-transparent'}`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details Panel */}
        <div className="space-y-5">

          {/* Title & Stats */}
          <div>
            <div className="flex items-start justify-between">
              <h1 className="text-2xl font-black font-outfit text-gray-900 dark:text-gray-100 leading-tight flex-1 pr-3">
                {listing.title}
              </h1>
              <button
                onClick={() => navigator.share?.({ title: listing.title, url: window.location.href })}
                className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800"
              >
                <Share2 className="h-4.5 w-4.5" />
              </button>
            </div>
            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400 dark:text-gray-500">
              <span className="flex items-center space-x-1"><Eye className="h-3.5 w-3.5" /><span>{listing.viewCount} views</span></span>
              <span className="flex items-center space-x-1"><Repeat className="h-3.5 w-3.5" /><span>{listing.requestCount} requests</span></span>
              <span className="flex items-center space-x-1"><Tag className="h-3.5 w-3.5" /><span>{listing.category?.name}</span></span>
            </div>
          </div>

          {/* Pricing */}
          <div className="p-4 bg-primary-50 dark:bg-primary-950/20 border border-primary-100 dark:border-primary-900/30 rounded-2xl">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-extrabold text-primary-700 dark:text-primary-400">
                  ₹{listing.rentalPrice}
                </p>
                <p className="text-sm text-primary-500 dark:text-primary-500 font-medium capitalize">
                  per {listing.priceUnit.toLowerCase()}
                </p>
              </div>
              {listing.securityDeposit > 0 && (
                <div className="text-right">
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Security Deposit</p>
                  <p className="text-lg font-bold text-gray-700 dark:text-gray-300">₹{listing.securityDeposit}</p>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">About this item</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{listing.description}</p>
          </div>

          {/* Owner Card */}
          <Link to={`/profile/${listing.owner._id}`} className="flex items-center space-x-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 hover:shadow-md transition-all group">
            <img src={listing.owner.avatar} alt={listing.owner.fullName} className="h-12 w-12 rounded-full border border-gray-200 dark:border-slate-700 object-cover" />
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100 group-hover:text-primary-600 transition-colors">{listing.owner.fullName}</p>
              <div className="flex items-center text-xs text-amber-500 font-bold mt-0.5">
                <Star className="h-3.5 w-3.5 fill-current mr-1" />
                <span>{listing.owner.ratingAverage?.toFixed(1)} · {listing.owner.completedRentals} rentals completed</span>
              </div>
            </div>
            <User className="h-4.5 w-4.5 text-gray-400" />
          </Link>

          {/* Status Banner */}
          {!isAvailable && (
            <div className="flex items-center space-x-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-700 dark:text-amber-400 text-sm">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <p className="font-medium">This item is currently {listing.status.toLowerCase()} and not available for rental.</p>
            </div>
          )}

          {/* CTA Buttons */}
          {!isOwner ? (
            <div className="space-y-3">
              {user ? (
                isAvailable ? (
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <button
                        onClick={() => toggleWishlist(listing)}
                        className={`p-3.5 rounded-2xl border transition-all flex items-center justify-center ${
                          isInWishlist(listing._id)
                            ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-500 shadow-sm'
                            : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:text-red-500'
                        }`}
                        title={isInWishlist(listing._id) ? 'Remove from wishlist' : 'Save to wishlist'}
                      >
                        <Heart className={`h-5 w-5 ${isInWishlist(listing._id) ? 'fill-current' : ''}`} />
                      </button>

                      <button
                        onClick={() => {
                          if (isInCart(listing._id)) {
                            removeFromCart(listing._id);
                          } else {
                            addToCart(listing);
                          }
                        }}
                        className={`p-3.5 rounded-2xl border transition-all flex items-center justify-center ${
                          isInCart(listing._id)
                            ? 'bg-primary-50 dark:bg-primary-950/30 border-primary-300 dark:border-primary-700 text-primary-600 font-bold'
                            : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:text-primary-600'
                        }`}
                        title={isInCart(listing._id) ? 'Remove from bag' : 'Add to rent bag'}
                      >
                        <ShoppingBag className="h-5 w-5" />
                      </button>

                      <button
                        onClick={() => setRequestOpen(true)}
                        className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center space-x-2 shadow-lg shadow-primary-500/20 transition-all"
                      >
                        <Calendar className="h-5 w-5" />
                        <span>Request to Rent</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <button disabled className="w-full bg-gray-200 dark:bg-slate-800 text-gray-500 dark:text-gray-400 font-bold py-3.5 rounded-2xl cursor-not-allowed">
                    Currently Unavailable
                  </button>
                )
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={() => toggleWishlist(listing)}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-center ${
                      isInWishlist(listing._id)
                        ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-500 shadow-sm'
                        : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:text-red-500'
                    }`}
                  >
                    <Heart className={`h-5 w-5 ${isInWishlist(listing._id) ? 'fill-current' : ''}`} />
                  </button>
                  <Link
                    to="/login"
                    className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-bold py-3.5 rounded-2xl text-center shadow-lg shadow-primary-500/20"
                  >
                    Login to Request Rental
                  </Link>
                </div>
              )}

              <div className="p-3 bg-gray-50 dark:bg-slate-800/50 rounded-xl text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  💳 Payment is handled <strong>offline between students</strong>. Rentora does not process payments.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex gap-3">
              <Link to={`/my-listings`} className="flex-1 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 font-bold py-3 rounded-2xl text-center text-sm hover:bg-gray-50 dark:hover:bg-slate-800 transition-all">
                Manage Listings
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Rental Request Modal */}
      {requestOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md shadow-2xl border border-gray-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-black font-outfit">Request to Rent</h3>
              <button onClick={() => setRequestOpen(false)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800">
                <ChevronLeft className="h-5 w-5" />
              </button>
            </div>

            {requestError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm mb-4">
                {requestError}
              </div>
            )}

            <form onSubmit={handleRentalRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Start Date</label>
                <input
                  type="date"
                  required
                  min={todayStr}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-gray-100 px-4 py-3 rounded-2xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:border-primary-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">End Date</label>
                <input
                  type="date"
                  required
                  min={startDate || todayStr}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-gray-100 px-4 py-3 rounded-2xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:border-primary-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Message (Optional)</label>
                <textarea
                  placeholder="Tell the owner why you need this item..."
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 px-4 py-3 rounded-2xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:border-primary-500 text-sm resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-2xl flex items-center justify-center space-x-2 disabled:opacity-50 shadow-lg shadow-primary-500/20 transition-all"
              >
                {submitting ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : (
                  <>
                    <MessageCircle className="h-5 w-5" />
                    <span>Send Request</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default ListingDetails;

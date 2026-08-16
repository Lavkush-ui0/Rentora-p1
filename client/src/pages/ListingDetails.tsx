import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWishlist, ListingSummary } from '../context/WishlistContext';
import { listingService } from '../services/listingService';
import { rentalService } from '../services/rentalService';
import { chatService } from '../services/chatService';
import { getImageUrl } from '../utils/imageUrl';
import { adminService } from '../services/adminService';
import {
  Star, Eye, Repeat, ChevronLeft, ChevronRight, Calendar, MessageCircle,
  AlertTriangle, Package, Share2, Heart, ShoppingBag, Flag, MapPin, X
} from 'lucide-react';
import { ArtworkTile, PaymentNotice } from '../components/RentoraBrand';

const conditionColors: Record<string, string> = {
  NEW: 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400 border border-green-200 dark:border-green-800',
  LIKE_NEW: 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800',
  GOOD: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800',
  FAIR: 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border border-red-200 dark:border-red-800',
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
  
  // Date Picker State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [message, setMessage] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  
  const [submitting, setSubmitting] = useState(false);
  const [requestError, setRequestError] = useState('');
  const [blockedDates, setBlockedDates] = useState<any[]>([]);

  // Report/Flag state
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('Inappropriate Content');
  const [reportDesc, setReportDesc] = useState('');
  const [reporting, setReporting] = useState(false);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        await listingService.incrementViewCount(id!);
        const res = await listingService.getListingById(id!);
        if (res.data?.success) {
          setListing(res.data.listing);
          setBlockedDates(res.data.blockedDates || []);
        }
      } catch (err) {
        console.error('[ListingDetails] Error:', err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchListing();
  }, [id]);

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    setReporting(true);
    try {
      await adminService.submitReport({
        targetType: 'LISTING',
        targetId: listing._id,
        reason: reportReason,
        description: reportDesc,
      });
      alert('Thank you. The report has been submitted to the platform administrators for review.');
      setReportOpen(false);
      setReportDesc('');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit report. Please try again.');
    } finally {
      setReporting(false);
    }
  };

  const handleAdminTakeDown = async () => {
    if (!window.confirm('Are you sure you want to take down this listed item? This will mark it as REMOVED.')) return;
    try {
      await adminService.removeListing(listing._id);
      alert('The listing has been successfully taken down.');
      setListing((prev: any) => (prev ? { ...prev, status: 'REMOVED', availability: false } : null));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to take down listing.');
    }
  };

  const handleRentalRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setRequestError('');

    if (!acceptTerms) {
      setRequestError('You must acknowledge the offline payment and safety guidelines before submitting.');
      return;
    }

    const selectStart = new Date(startDate);
    const selectEnd = new Date(endDate);
    if (selectEnd < selectStart) {
      setRequestError('End date must be on or after start date.');
      return;
    }

    const hasOverlap = blockedDates.some((r: any) => {
      const blockedStart = new Date(r.start);
      const blockedEnd = new Date(r.end);
      return (selectStart <= blockedEnd && selectEnd >= blockedStart);
    });

    if (hasOverlap) {
      setRequestError('The selected dates overlap with an existing active booking. Please choose another date range.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await rentalService.createRentalRequest({
        listing: listing._id,
        startDate,
        endDate,
        message,
      });
      setRequestOpen(false);
      if (res.data?.conversationId) {
        navigate(`/messages/${res.data.conversationId}`);
      } else {
        navigate('/my-rentals');
      }
    } catch (err: any) {
      setRequestError(err.response?.data?.message || 'Failed to send rental request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDirectMessage = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      const res = await chatService.createConversation({
        recipientId: listing.owner._id,
        listingId: listing._id,
      });
      if (res.data?.success && res.data.conversation?._id) {
        navigate(`/messages/${res.data.conversation._id}`);
      } else {
        navigate(`/messages?recipient=${listing.owner._id}&listing=${listing._id}`);
      }
    } catch (err) {
      navigate(`/messages?recipient=${listing.owner._id}&listing=${listing._id}`);
    }
  };

  const isOwner = user && listing?.owner?._id === user.id;
  const isAdmin = user && user.role === 'ADMIN';
  const isAvailable = listing?.status === 'ACTIVE' && listing?.availability;
  const todayStr = new Date().toISOString().split('T')[0];

  // Calculate rental cost helper
  const calculateTotalCost = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.max(1, end.getTime() - start.getTime());
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let basePrice = listing.rentalPrice;
    if (listing.priceUnit === 'WEEK') {
      return (basePrice / 7) * days;
    } else if (listing.priceUnit === 'MONTH') {
      return (basePrice / 30) * days;
    }
    return basePrice * days;
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="aspect-[4/3] bg-gray-100 dark:bg-slate-800 rounded-3xl"></div>
          <div className="space-y-4 py-4">
            <div className="h-8 bg-gray-100 dark:bg-slate-800 rounded-full w-3/4"></div>
            <div className="h-4 bg-gray-100 dark:bg-slate-800 rounded-full w-1/2"></div>
            <div className="h-24 bg-gray-100 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
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
        <Link to="/explore" className="mt-4 inline-block text-[#9E1B1B] font-semibold">Browse other items</Link>
      </div>
    );
  }

  const isMockImage = !listing.images || listing.images.length === 0 || listing.images[0].includes('mock') || listing.images[0].includes('picsum');
  const themes = ['mint', 'peach', 'lavender', 'blue', 'sand', 'rose'] as const;
  const themeIndex = (listing.title.length + (listing.title.charCodeAt(0) || 0)) % themes.length;
  const selectedTheme = themes[themeIndex];

  return (
    <div className="max-w-5xl mx-auto space-y-8 text-left">
      
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
        <Link to="/explore" className="hover:text-[#9E1B1B] transition-colors font-display">Explore</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-slate-700 dark:text-slate-350 font-display truncate max-w-[200px]">{listing.title}</span>
      </nav>

      {/* Split 2-Column View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Image / Artwork, Condition, PaymentNotice */}
        <div className="lg:col-span-5 space-y-6">
          <div className="relative aspect-[4/3] bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-md group">
            {isMockImage ? (
              <ArtworkTile
                category={listing.category?.name || 'Gear'}
                theme={selectedTheme}
                title={listing.title}
                className="w-full h-full border-none rounded-none"
              />
            ) : (
              <>
                <img
                  src={getImageUrl(listing.images[currentImg])}
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
              </>
            )}

            {/* Condition Tag overlay */}
            <span className={`absolute top-3 left-3 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider font-display shadow-sm ${conditionColors[listing.condition] || conditionColors.GOOD}`}>
              {listing.condition?.replace('_', ' ') || 'Good'}
            </span>
          </div>

          {/* Thumbnails */}
          {!isMockImage && listing.images.length > 1 && (
            <div className="flex space-x-2 overflow-x-auto pb-1">
              {listing.images.map((img: string, i: number) => (
                <button
                  key={i}
                  onClick={() => setCurrentImg(i)}
                  className={`h-14 w-14 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${i === currentImg ? 'border-[#9E1B1B]' : 'border-transparent bg-slate-50'}`}
                >
                  <img src={getImageUrl(img)} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* PaymentNotice Warning block */}
          <PaymentNotice />
        </div>

        {/* Right Column: Specifications, Price, Lender Info, Request CTAs */}
        <div className="lg:col-span-7 space-y-6">
          {/* Header Info */}
          <div>
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-black text-[#9E1B1B] uppercase tracking-[0.18em] font-display">
                  {listing.category?.name || 'Gear Item'}
                </span>
                <h1 className="text-2xl md:text-3xl font-black font-display uppercase tracking-tight text-slate-900 dark:text-white leading-tight mt-1">
                  {listing.title}
                </h1>
              </div>
              <div className="flex items-center space-x-1 flex-shrink-0">
                <button
                  onClick={() => navigator.share?.({ title: listing.title, url: window.location.href })}
                  className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Share Item Link"
                >
                  <Share2 className="h-4.5 w-4.5" />
                </button>
                {user && !isOwner && (
                  <button
                    onClick={() => setReportOpen(true)}
                    className="p-2 rounded-xl text-red-500 hover:bg-red-55/15 dark:hover:bg-red-950/25 transition-colors"
                    title="Report Flag"
                  >
                    <Flag className="h-4.5 w-4.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Meta tags views/requests */}
            <div className="flex items-center space-x-4 mt-3 text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
              <span className="flex items-center space-x-1"><Eye className="h-3.5 w-3.5" /><span>{listing.viewCount || 0} views</span></span>
              <span className="flex items-center space-x-1"><Repeat className="h-3.5 w-3.5" /><span>{listing.requestCount || 0} requests</span></span>
              {listing.location && (
                <span className="flex items-center space-x-1 text-[#22716E] dark:text-[#5FD2CA]">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{listing.location}</span>
                </span>
              )}
            </div>
          </div>

          {/* Pricing Box Details */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl grid grid-cols-2 gap-4 shadow-sm">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Rental Price</p>
              <p className="text-2xl font-black text-[#9E1B1B] dark:text-[#E03E3E] font-display mt-1">
                ₹{listing.rentalPrice}
              </p>
              <p className="text-[10px] text-slate-400 font-bold capitalize mt-0.5">
                per {(listing.priceUnit || 'day').toLowerCase()}
              </p>
            </div>
            {listing.securityDeposit > 0 && (
              <div className="text-right border-l border-slate-100 dark:border-slate-800 pl-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Security Deposit</p>
                <p className="text-xl font-bold text-slate-800 dark:text-slate-200 font-display mt-1">
                  ₹{listing.securityDeposit}
                </p>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">Fully Refundable</p>
              </div>
            )}
          </div>

          {/* Specification / Description */}
          <div className="space-y-2">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Item Specifications</h3>
            <p className="text-xs md:text-sm text-slate-700 dark:text-slate-350 leading-relaxed font-sans font-medium bg-slate-50 dark:bg-slate-900/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              {listing.description || 'No detailed specifications listed for this item.'}
            </p>
          </div>

          {/* Owner details reputation card */}
          <Link 
            to={`/profile/${listing.owner._id}`}
            className="flex items-center space-x-3.5 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all group"
          >
            <img 
              src={listing.owner.avatar} 
              alt={listing.owner.fullName} 
              className="h-10 w-10 rounded-full border border-slate-200 dark:border-slate-850 object-cover flex-shrink-0" 
            />
            <div className="flex-1 text-left leading-tight">
              <p className="text-xs font-black text-slate-900 dark:text-slate-100 group-hover:text-[#9E1B1B] transition-colors">
                Lender: {listing.owner.fullName}
              </p>
              <div className="flex items-center text-[10px] text-amber-500 font-bold mt-1">
                <Star className="h-3 w-3 fill-current mr-1 text-amber-500" />
                <span>{(listing.owner.ratingAverage ?? 5.0).toFixed(1)} · Verified Classmate ({listing.owner.completedRentals || 0} completed exchanges)</span>
              </div>
            </div>
            <ChevronRight className="h-4.5 w-4.5 text-slate-400 group-hover:text-[#9E1B1B] transition-colors" />
          </Link>

          {/* Status availability Alert banner */}
          {!isAvailable && (
            <div className="flex items-center space-x-2.5 p-3.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl text-amber-800 dark:text-amber-400 text-xs">
              <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
              <p className="font-bold">This item is currently {listing.status.toLowerCase()} or already active on campus.</p>
            </div>
          )}

          {/* Admin Moderation Box */}
          {isAdmin && listing.status !== 'REMOVED' && (
            <div className="p-5 bg-red-50 dark:bg-red-950/15 border border-red-200 dark:border-red-900/30 rounded-3xl space-y-3.5 shadow-sm">
              <div className="flex items-center space-x-2 text-red-700 dark:text-red-400">
                <Flag className="h-5 w-5 fill-current" />
                <h4 className="font-display font-black text-sm">Admin Controls</h4>
              </div>
              <p className="text-xs text-red-650 dark:text-red-400/80 leading-relaxed font-medium">
                As an administrator, you can immediately remove this item from the campus marketplace if it violates guidelines or is inappropriate.
              </p>
              <button
                onClick={handleAdminTakeDown}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-extrabold py-3.5 rounded-2xl flex items-center justify-center space-x-2 transition-all shadow-md shadow-red-500/10 active:scale-95 text-xs"
              >
                <span>Take Down Listing</span>
              </button>
            </div>
          )}

          {/* CTAs booking triggers */}
          {!isOwner ? (
            <div className="space-y-3">
              {user ? (
                isAvailable ? (
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <button
                        onClick={() => toggleWishlist(listing as ListingSummary)}
                        className={`p-3.5 rounded-2xl border transition-all flex items-center justify-center ${
                          isInWishlist(listing._id)
                            ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-500 shadow-sm'
                            : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:text-red-500'
                        }`}
                        title="Save wishlist"
                      >
                        <Heart className={`h-4.5 w-4.5 ${isInWishlist(listing._id) ? 'fill-current' : ''}`} />
                      </button>

                      <button
                        onClick={() => {
                          if (isInCart(listing._id)) {
                            removeFromCart(listing._id);
                          } else {
                            addToCart(listing as ListingSummary);
                          }
                        }}
                        className={`p-3.5 rounded-2xl border transition-all flex items-center justify-center ${
                          isInCart(listing._id)
                            ? 'bg-[#22716E]/10 border-[#22716E]/30 text-[#22716E] dark:text-[#5FD2CA]'
                            : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:text-[#22716E]'
                        }`}
                        title="Add to rent bag"
                      >
                        <ShoppingBag className="h-4.5 w-4.5" />
                      </button>

                      <button
                        onClick={() => setRequestOpen(true)}
                        className="flex-1 bg-[#9E1B1B] hover:bg-[#801414] text-white font-extrabold py-3.5 rounded-2xl flex items-center justify-center space-x-2 shadow-lg shadow-[#9E1B1B]/15 transition-all text-xs uppercase tracking-wider active:scale-[0.98]"
                      >
                        <Calendar className="h-4.5 w-4.5" />
                        <span>Request to Rent</span>
                      </button>
                    </div>

                    <button
                      onClick={handleDirectMessage}
                      className="w-full border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 font-bold px-5 py-3.5 rounded-2xl flex items-center justify-center space-x-2 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all text-xs"
                    >
                      <MessageCircle className="h-4.5 w-4.5" />
                      <span>Message Owner</span>
                    </button>
                  </div>
                ) : (
                  <button disabled className="w-full bg-slate-100 dark:bg-slate-850 text-slate-400 dark:text-slate-500 font-extrabold py-3.5 rounded-2xl cursor-not-allowed text-xs">
                    CURRENTLY UNAVAILABLE
                  </button>
                )
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={() => toggleWishlist(listing as ListingSummary)}
                    className="p-3.5 rounded-2xl border border-slate-250/50 text-slate-500"
                  >
                    <Heart className="h-4.5 w-4.5" />
                  </button>
                  <Link
                    to="/login"
                    className="flex-1 bg-[#9E1B1B] hover:bg-[#801414] text-white font-extrabold py-3.5 rounded-2xl text-center shadow-lg text-xs uppercase tracking-wider flex items-center justify-center"
                  >
                    Login to Request Rental
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="flex gap-3">
              <Link 
                to={`/my-listings`} 
                className="flex-1 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold py-3 rounded-2xl text-center text-xs hover:bg-slate-50 dark:hover:bg-slate-900 transition-all"
              >
                Manage My Listings
              </Link>
            </div>
          )}
        </div>

      </div>

      {/* Interactive Rental Request Modal (<RequestModal />) */}
      {requestOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md shadow-2xl border border-[#42525B]/20 animate-in zoom-in-95 duration-200 text-left">
            <div className="flex items-center justify-between mb-5 border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black font-display uppercase tracking-tight text-slate-900 dark:text-white">Request to Rent</h3>
              <button 
                onClick={() => setRequestOpen(false)} 
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            {requestError && (
              <div className="p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-2xl text-red-700 dark:text-red-400 text-xs mb-4">
                {requestError}
              </div>
            )}

            {blockedDates.length > 0 && (
              <div className="p-3.5 bg-[#FFF0CE] dark:bg-amber-950/15 border border-[#F5B46E]/30 rounded-2xl mb-4 text-xs">
                <span className="font-bold text-[#C87D1B] dark:text-[#F5B46E] block mb-1">📅 Reserved / Booked Dates:</span>
                <ul className="list-disc pl-4 space-y-0.5 text-slate-700 dark:text-slate-400 font-medium">
                  {blockedDates.map((d: any, idx: number) => (
                    <li key={idx}>
                      {new Date(d.start).toLocaleDateString()} to {new Date(d.end).toLocaleDateString()}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <form onSubmit={handleRentalRequest} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Start Date</label>
                <input
                  type="date"
                  required
                  min={todayStr}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-[#9E1B1B] text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">End Date</label>
                <input
                  type="date"
                  required
                  min={startDate || todayStr}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-[#9E1B1B] text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Pickup / Delivery Note</label>
                <textarea
                  placeholder="Tell the owner where you want to meet (e.g. Plot 19 Canteen on Monday)..."
                  rows={2.5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-[#9E1B1B] text-xs font-semibold resize-none"
                />
              </div>

              {/* Real-time Cost Calculation Display */}
              {startDate && endDate && (
                <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-500">Calculated Cost:</span>
                  <span className="text-[#9E1B1B] dark:text-[#E03E3E] font-display text-sm">
                    ₹{calculateTotalCost()} {listing.securityDeposit > 0 ? `(+ ₹${listing.securityDeposit} deposit)` : ''}
                  </span>
                </div>
              )}

              {/* Safety checkout offline payment acknowledgment checkbox */}
              <div className="flex items-start space-x-2 pt-1.5 pb-2">
                <input
                  id="checkout-ack"
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-0.5 border-slate-350 text-[#9E1B1B] focus:ring-[#9E1B1B] rounded h-3.5 w-3.5"
                />
                <label htmlFor="checkout-ack" className="text-[10px] text-slate-500 dark:text-slate-400 font-bold leading-tight select-none">
                  Acknowledge that payments & handovers are completed **offline in person** on campus landmark spots.
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#9E1B1B] hover:bg-[#801414] text-white font-extrabold py-3.5 rounded-2xl flex items-center justify-center space-x-2 disabled:opacity-50 shadow-lg shadow-[#9E1B1B]/15 transition-all text-xs uppercase tracking-wider"
              >
                {submitting ? (
                  <div className="h-4.5 w-4.5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : (
                  <>
                    <MessageCircle className="h-4.5 w-4.5" />
                    <span>Send Rental Request</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Flag/Report Modal */}
      {reportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md shadow-2xl border border-[#42525B]/20 animate-in zoom-in-95 duration-200 text-left">
            <div className="flex items-center justify-between mb-5 border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black font-display uppercase tracking-tight text-red-650 flex items-center space-x-2">
                <Flag className="h-4.5 w-4.5 fill-current" />
                <span>Flag Listing</span>
              </h3>
              <button 
                onClick={() => setReportOpen(false)} 
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleReportSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Reason</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-[#9E1B1B] text-xs font-bold"
                >
                  <option value="Inappropriate Content">Inappropriate Content</option>
                  <option value="Prohibited/Illegal Item">Prohibited/Illegal Item</option>
                  <option value="Incorrect Description">Incorrect Description</option>
                  <option value="Fraudulent owner">Fraudulent Owner</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Explanation</label>
                <textarea
                  required
                  placeholder="Provide details about why this listing violates campus peer-to-peer sharing codes..."
                  rows={4}
                  value={reportDesc}
                  onChange={(e) => setReportDesc(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-[#9E1B1B] text-xs font-semibold resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={reporting}
                className="w-full bg-red-650 hover:bg-red-700 text-white font-extrabold py-3.5 rounded-2xl flex items-center justify-center space-x-2 disabled:opacity-50 shadow-lg shadow-red-500/10 transition-all text-xs uppercase tracking-wider"
              >
                {reporting ? (
                  <div className="h-4.5 w-4.5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : (
                  <>
                    <Flag className="h-4.5 w-4.5" />
                    <span>Submit Report</span>
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

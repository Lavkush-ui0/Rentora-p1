import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { listingService } from '../services/listingService';
import { Link } from 'react-router-dom';
import { Plus, PauseCircle, PlayCircle, Trash2, Eye, Package, Clock, CheckCircle, XCircle } from 'lucide-react';
import { getImageUrl } from '../utils/imageUrl';

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400',
  PAUSED: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
  RENTED: 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400',
  REMOVED: 'bg-gray-50 text-gray-500 dark:bg-slate-800 dark:text-gray-500',
};

const ApprovalBadge: React.FC<{ approvalStatus: string; rejectionReason?: string }> = ({ approvalStatus, rejectionReason }) => {
  if (approvalStatus === 'PENDING') {
    return (
      <span className="flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-900/30">
        <Clock className="h-2.5 w-2.5" /> Pending Review
      </span>
    );
  }
  if (approvalStatus === 'REJECTED') {
    return (
      <div className="flex flex-col gap-0.5">
        <span className="flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/30">
          <XCircle className="h-2.5 w-2.5" /> Rejected
        </span>
        {rejectionReason && (
          <p className="text-[10px] text-red-500 dark:text-red-400 pl-1 leading-tight max-w-[200px] truncate" title={rejectionReason}>
            Reason: {rejectionReason}
          </p>
        )}
      </div>
    );
  }
  if (approvalStatus === 'APPROVED') {
    return (
      <span className="flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-900/30">
        <CheckCircle className="h-2.5 w-2.5" /> Approved
      </span>
    );
  }
  return null;
};

export const MyListings: React.FC = () => {
  const { user } = useAuth();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');

  const fetchListings = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      // Fetch all listings for current user across all statuses
      const statuses = ['ACTIVE', 'PAUSED', 'RENTED', 'REMOVED'];
      const allListings: any[] = [];
      for (const status of statuses) {
        try {
          const res = await listingService.getListings({ owner: user.id, limit: 100, status });
          if (res.data?.success && Array.isArray(res.data.listings)) {
            allListings.push(...res.data.listings);
          }
        } catch (err) {
          console.warn('[MyListings] Error fetching status:', status, err);
        }
      }
      // Ensure unique listings and strictly owned by user
      const uniqueListings = Array.from(new Map(allListings.map(l => [l._id, l])).values());
      const strictlyOwnListings = uniqueListings.filter((l: any) => {
        const ownerId = l.owner?._id || l.owner;
        return String(ownerId) === String(user.id);
      });
      strictlyOwnListings.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setListings(strictlyOwnListings);
    } catch (err) {
      console.error('[MyListings] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchListings();
    }
  }, [user?.id]);

  const handleTogglePause = async (id: string) => {
    setActionLoading(id + 'pause');
    try {
      await listingService.togglePauseListing(id);
      await fetchListings();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update listing.');
    } finally {
      setActionLoading('');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this listing?')) return;
    setActionLoading(id + 'delete');
    try {
      await listingService.deleteListing(id);
      await fetchListings();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to remove listing.');
    } finally {
      setActionLoading('');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse flex gap-4 bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 p-4">
            <div className="h-24 w-24 bg-gray-100 dark:bg-slate-800 rounded-2xl flex-shrink-0"></div>
            <div className="flex-1 space-y-3">
              <div className="h-4 bg-gray-100 dark:bg-slate-800 rounded-full w-2/3"></div>
              <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded-full w-1/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black font-outfit text-gray-900 dark:text-gray-100">My Listings</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{listings.length} listings</p>
        </div>
        <Link
          to="/list-item"
          className="flex items-center space-x-1.5 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-2xl text-sm font-bold shadow-sm hover:shadow transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>New Listing</span>
        </Link>
      </div>

      {listings.length > 0 ? (
        <div className="space-y-4">
          {listings.map((listing) => (
            <div key={listing._id} className="flex gap-4 bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 p-4 hover:shadow-md transition-all">
              <img
                src={getImageUrl(listing.images?.[0], 'https://picsum.photos/150/150')}
                alt={listing.title}
                className="h-24 w-24 object-cover rounded-2xl flex-shrink-0 border border-gray-100 dark:border-slate-800"
              />
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <Link to={`/listing/${listing._id}`} className="font-bold text-gray-900 dark:text-gray-100 hover:text-primary-600 transition-colors text-sm leading-tight">
                    {listing.title}
                  </Link>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${statusColors[listing.status]}`}>
                      {listing.status}
                    </span>
                    {listing.approvalStatus && (
                      <ApprovalBadge approvalStatus={listing.approvalStatus} rejectionReason={listing.rejectionReason} />
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  ₹{listing.rentalPrice}/{listing.priceUnit.toLowerCase()} · {listing.condition.replace('_', ' ')}
                </p>
                <div className="flex items-center space-x-3 text-xs text-gray-400 dark:text-gray-500">
                  <span className="flex items-center space-x-1"><Eye className="h-3.5 w-3.5" /><span>{listing.viewCount} views</span></span>
                  <span>{listing.requestCount} requests</span>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {listing.status !== 'REMOVED' && listing.approvalStatus !== 'PENDING' && (
                    <>
                      <button
                        onClick={() => handleTogglePause(listing._id)}
                        disabled={actionLoading === listing._id + 'pause' || listing.status === 'RENTED'}
                        className="flex items-center space-x-1 px-3 py-1.5 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 text-xs font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-all disabled:opacity-40"
                      >
                        {listing.status === 'ACTIVE'
                          ? <><PauseCircle className="h-3.5 w-3.5" /><span>Pause</span></>
                          : <><PlayCircle className="h-3.5 w-3.5" /><span>Resume</span></>
                        }
                      </button>
                      <button
                        onClick={() => handleDelete(listing._id)}
                        disabled={actionLoading === listing._id + 'delete'}
                        className="flex items-center space-x-1 px-3 py-1.5 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 transition-all disabled:opacity-40"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Remove</span>
                      </button>
                    </>
                  )}
                  {listing.approvalStatus === 'PENDING' && (
                    <p className="text-[10px] text-orange-500 dark:text-orange-400 font-medium flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Awaiting admin approval — your listing will go live once approved.
                    </p>
                  )}
                  {listing.approvalStatus !== 'PENDING' && listing.status !== 'REMOVED' && (
                    <button
                      onClick={() => handleDelete(listing._id)}
                      disabled={actionLoading === listing._id + 'delete'}
                      className="flex items-center space-x-1 px-3 py-1.5 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 transition-all disabled:opacity-40"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <Package className="h-16 w-16 mx-auto text-gray-200 dark:text-gray-700 mb-4" />
          <p className="font-bold text-gray-500 dark:text-gray-400">No listings yet</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Start earning by listing items you own.</p>
          <Link to="/list-item" className="mt-4 inline-flex items-center space-x-1.5 bg-primary-600 text-white px-5 py-2.5 rounded-2xl font-bold text-sm shadow-sm">
            <Plus className="h-4.5 w-4.5" />
            <span>Create First Listing</span>
          </Link>
        </div>
      )}
    </div>
  );
};
export default MyListings;

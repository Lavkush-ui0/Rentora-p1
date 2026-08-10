import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { listingService } from '../services/listingService';
import { Link } from 'react-router-dom';
import { Plus, PauseCircle, PlayCircle, Trash2, Eye, Package } from 'lucide-react';

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400',
  PAUSED: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
  RENTED: 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400',
  REMOVED: 'bg-gray-50 text-gray-500 dark:bg-slate-800 dark:text-gray-500',
};

export const MyListings: React.FC = () => {
  const { user } = useAuth();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');

  const fetchListings = async () => {
    setLoading(true);
    try {
      // Fetch all listings for current user across all statuses
      const statuses = ['ACTIVE', 'PAUSED', 'RENTED', 'REMOVED'];
      const allListings: any[] = [];
      for (const status of statuses) {
        try {
          const res = await listingService.getListings({ limit: 100, status });
          if (res.data?.success) {
            const ownListings = res.data.listings.filter((l: any) =>
              l.owner?._id === user?.id || l.owner === user?.id
            );
            allListings.push(...ownListings);
          }
        } catch {}
      }
      setListings(allListings);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchListings(); }, []);

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
                src={listing.images?.[0] || 'https://picsum.photos/150/150'}
                alt={listing.title}
                className="h-24 w-24 object-cover rounded-2xl flex-shrink-0 border border-gray-100 dark:border-slate-800"
              />
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <Link to={`/listing/${listing._id}`} className="font-bold text-gray-900 dark:text-gray-100 hover:text-primary-600 transition-colors text-sm leading-tight">
                    {listing.title}
                  </Link>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${statusColors[listing.status]}`}>
                    {listing.status}
                  </span>
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
                  {listing.status !== 'REMOVED' && (
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

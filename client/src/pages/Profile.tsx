import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { listingService } from '../services/listingService';
import { reviewService } from '../services/reviewService';
import { Star, Package, CheckCircle2, Calendar, BookOpen, Edit3 } from 'lucide-react';
import ProductCard from '../components/ProductCard';

export const Profile: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const { user } = useAuth();
  const profileId = id || user?.id;
  const isOwnProfile = !id || id === user?.id;

  const [profile, setProfile] = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      if (!profileId) return;
      setLoading(true);
      try {
        const [profileRes, listingsRes, reviewsRes] = await Promise.all([
          authService.getProfileById(profileId),
          listingService.getListings({ owner: profileId, status: 'ACTIVE', limit: 20 }),
          reviewService.getUserReviews(profileId),
        ]);
        if (profileRes.data?.success) setProfile(profileRes.data.user);
        if (listingsRes.data?.success && Array.isArray(listingsRes.data.listings)) {
          // Strict owner filter check
          const filtered = listingsRes.data.listings.filter((l: any) => {
            const ownerId = l.owner?._id || l.owner;
            return String(ownerId) === String(profileId);
          });
          setListings(filtered);
        }
        if (reviewsRes.data?.success) setReviews(reviewsRes.data.reviews);
      } catch (err) {
        console.error('[Profile] Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [profileId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto animate-pulse space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 p-6 flex items-center space-x-5">
          <div className="h-20 w-20 rounded-full bg-gray-100 dark:bg-slate-800"></div>
          <div className="space-y-3 flex-1">
            <div className="h-5 bg-gray-100 dark:bg-slate-800 rounded-full w-1/3"></div>
            <div className="h-4 bg-gray-100 dark:bg-slate-800 rounded-full w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) return <div className="text-center py-24 text-gray-500">Profile not found.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">

      {/* Profile Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <img
                src={profile.avatar}
                alt={profile.fullName}
                className="h-20 w-20 rounded-2xl border-2 border-gray-100 dark:border-slate-700 object-cover"
              />
              {profile.role === 'ADMIN' && (
                <span className="absolute -bottom-2 -right-2 bg-primary-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border-2 border-white dark:border-slate-900">
                  ADMIN
                </span>
              )}
            </div>
            <div>
              <h1 className="text-xl font-black font-outfit text-gray-900 dark:text-gray-100">{profile.fullName}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{profile.course} · {profile.branch} · Year {profile.year}</p>
              {profile.bio && <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 max-w-md">{profile.bio}</p>}
            </div>
          </div>
          {isOwnProfile && (
            <Link to="/settings" className="flex items-center space-x-1.5 px-4 py-2 rounded-2xl border border-gray-200 dark:border-slate-700 text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all">
              <Edit3 className="h-4 w-4" />
              <span>Edit Profile</span>
            </Link>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100 dark:border-slate-800">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1.5 text-amber-500">
              <Star className="h-5 w-5 fill-current" />
              <span className="text-2xl font-black text-gray-900 dark:text-gray-100">{profile.ratingAverage?.toFixed(1)}</span>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Rating ({profile.ratingCount} reviews)</p>
          </div>
          <div className="text-center border-x border-gray-100 dark:border-slate-800">
            <div className="flex items-center justify-center space-x-1.5">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-black text-gray-900 dark:text-gray-100">{profile.completedRentals}</span>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Completed Rentals</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1.5">
              <Package className="h-5 w-5 text-primary-500" />
              <span className="text-2xl font-black text-gray-900 dark:text-gray-100">{listings.length}</span>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Active Listings</p>
          </div>
        </div>
      </div>

      {/* Active Listings */}
      {listings.length > 0 && (
        <section>
          <h2 className="text-lg font-black font-outfit text-gray-900 dark:text-gray-100 mb-4 flex items-center space-x-2">
            <Package className="h-5 w-5 text-primary-500" />
            <span>{isOwnProfile ? 'My' : `${profile.fullName.split(' ')[0]}'s`} Listings</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {listings.map(l => <ProductCard key={l._id} listing={l} />)}
          </div>
        </section>
      )}

      {/* Reviews */}
      <section>
        <h2 className="text-lg font-black font-outfit text-gray-900 dark:text-gray-100 mb-4 flex items-center space-x-2">
          <Star className="h-5 w-5 text-amber-400" />
          <span>Reviews</span>
        </h2>
        {reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((rev: any) => (
              <div key={rev._id} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-4">
                <div className="flex items-start space-x-3">
                  <img src={rev.reviewer?.avatar} alt={rev.reviewer?.fullName} className="h-9 w-9 rounded-full border border-gray-100 dark:border-slate-700 object-cover" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{rev.reviewer?.fullName}</p>
                      <div className="flex text-amber-400 text-sm">
                        {'★'.repeat(rev.rating)}
                        <span className="text-gray-200 dark:text-gray-700">{'★'.repeat(5 - rev.rating)}</span>
                      </div>
                    </div>
                    {rev.comment && <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{rev.comment}</p>}
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(rev.createdAt).toLocaleDateString()}</span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400 dark:text-gray-600">
            <BookOpen className="h-10 w-10 mx-auto mb-2" />
            <p className="text-sm">No reviews yet.</p>
          </div>
        )}
      </section>
    </div>
  );
};
export default Profile;

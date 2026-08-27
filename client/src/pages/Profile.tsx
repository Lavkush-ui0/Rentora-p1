import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { listingService } from '../services/listingService';
import { reviewService } from '../services/reviewService';
import { compressImageIfNeeded } from '../utils/imageCompressor';
import { Star, Package, CheckCircle2, Calendar, BookOpen, Edit3, Camera, Loader2, Trash2, X } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { getAvatarUrl } from '../utils/imageUrl';

export const Profile: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { user, updateUser, deleteUserAccount } = useAuth();
  const profileId = id || user?.id;
  const isOwnProfile = !id || id === user?.id;

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const [profile, setProfile] = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarSuccess, setAvatarSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'renter' | 'lender'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;

    setUploadingAvatar(true);
    setAvatarSuccess('');
    try {
      // Automatically compress avatar if > 2MB
      const file = await compressImageIfNeeded(rawFile);

      const formData = new FormData();
      formData.append('avatar', file);
      if (profile?.fullName) formData.append('fullName', profile.fullName);
      if (profile?.course) formData.append('course', profile.course);
      if (profile?.branch) formData.append('branch', profile.branch);
      if (profile?.year) formData.append('year', String(profile.year));

      await updateUser(formData);

      // Create instant local preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile((prev: any) => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);

      setAvatarSuccess('Profile photo updated!');
      setTimeout(() => setAvatarSuccess(''), 4000);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to upload profile picture.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.toUpperCase() !== 'DELETE') return;
    setDeleting(true);
    try {
      await deleteUserAccount();
      navigate('/login');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete account. Please try again.');
      setDeleteModalOpen(false);
    } finally {
      setDeleting(false);
      setDeleteConfirmText('');
    }
  };

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
        {avatarSuccess && (
          <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-2xl flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{avatarSuccess}</span>
          </div>
        )}

        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-4">
            <div className="relative group">
              <img
                src={getAvatarUrl(profile.avatar, profile.fullName)}
                alt={profile.fullName}
                className="h-20 w-20 rounded-2xl border-2 border-gray-100 dark:border-slate-700 object-cover"
              />
              
              {/* Quick Avatar Change Button for own profile */}
              {isOwnProfile && (
                <>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    title="Change Profile Photo"
                    className="absolute inset-0 bg-black/50 rounded-2xl flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white cursor-pointer"
                  >
                    {uploadingAvatar ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <Camera className="h-5 w-5 mb-0.5" />
                        <span className="text-[9px] font-black uppercase tracking-wider">Change</span>
                      </>
                    )}
                  </button>
                </>
              )}

              {profile.role === 'ADMIN' && (
                <span className="absolute -bottom-2 -right-2 bg-brand-crimson text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border-2 border-white dark:border-slate-900 shadow-sm">
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
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-2xl border border-gray-200 dark:border-slate-700 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all shadow-sm"
              >
                <Camera className="h-3.5 w-3.5" />
                <span>Upload Photo</span>
              </button>
              <Link to="/settings" className="flex items-center space-x-1.5 px-4 py-2 rounded-2xl bg-brand-crimson hover:bg-brand-crimsonHover text-xs font-bold text-white transition-all shadow-crimson">
                <Edit3 className="h-3.5 w-3.5" />
                <span>Edit Profile</span>
              </Link>
              <button
                type="button"
                onClick={() => setDeleteModalOpen(true)}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-2xl border border-red-200 dark:border-red-900/30 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all shadow-sm"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Account</span>
              </button>
            </div>
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
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-black font-outfit text-gray-900 dark:text-gray-100 flex items-center space-x-2">
            <Star className="h-5 w-5 text-amber-400" />
            <span>Reviews ({reviews.length})</span>
          </h2>
          
          {/* Filter Tabs */}
          {reviews.length > 0 && (
            <div className="flex border border-gray-200 dark:border-slate-800 rounded-2xl p-1 bg-white dark:bg-slate-900 w-fit text-xs">
              {(['all', 'renter', 'lender'] as const).map(t => {
                const count = reviews.filter(rev => {
                  if (t === 'all') return true;
                  const isRenter = rev.rentalRequest && String(profile._id) === String(rev.rentalRequest.renter);
                  if (t === 'renter') return isRenter;
                  return !isRenter;
                }).length;
                return (
                  <button
                    key={t}
                    onClick={() => setActiveTab(t)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all capitalize ${
                      activeTab === t
                        ? 'bg-amber-500 text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                  >
                    {t === 'lender' ? 'as Lender' : t === 'renter' ? 'as Renter' : 'All'} ({count})
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {reviews.length > 0 ? (
          (() => {
            const filteredReviews = reviews.filter((rev: any) => {
              if (activeTab === 'all') return true;
              const isRenter = rev.rentalRequest && String(profile._id) === String(rev.rentalRequest.renter);
              if (activeTab === 'renter') return isRenter;
              return !isRenter;
            });

            if (filteredReviews.length === 0) {
              return (
                <div className="text-center py-12 text-gray-400 dark:text-gray-600 bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800">
                  <BookOpen className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">No reviews in this category.</p>
                </div>
              );
            }

            return (
              <div className="space-y-4">
                {filteredReviews.map((rev: any) => {
                  const isRenter = rev.rentalRequest && String(profile._id) === String(rev.rentalRequest.renter);
                  return (
                    <div key={rev._id} className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 p-5 hover:shadow-md transition-all">
                      <div className="flex items-start space-x-3">
                        <img src={getAvatarUrl(rev.reviewer?.avatar, rev.reviewer?.fullName)} alt={rev.reviewer?.fullName} className="h-10 w-10 rounded-full border border-gray-100 dark:border-slate-700 object-cover flex-shrink-0" />
                        <div className="flex-1 space-y-1.5">
                          <div className="flex items-start justify-between flex-wrap gap-2">
                            <div>
                              <p className="text-sm font-black text-gray-900 dark:text-gray-100 leading-none">{rev.reviewer?.fullName}</p>
                              {rev.rentalRequest?.listing?.title && (
                                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 flex items-center gap-1.5 flex-wrap">
                                  {isRenter ? (
                                    <span className="px-2 py-0.5 rounded-full font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                                      Renter
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
                                      Lender
                                    </span>
                                  )}
                                  <span>·</span>
                                  <span className="font-semibold text-gray-500 dark:text-gray-455">
                                    {rev.rentalRequest.listing.title}
                                  </span>
                                </p>
                              )}
                            </div>
                            <div className="flex text-amber-400 text-sm">
                              {'★'.repeat(rev.rating)}
                              <span className="text-gray-200 dark:text-gray-700">{'★'.repeat(5 - rev.rating)}</span>
                            </div>
                          </div>
                          {rev.comment && <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-medium">"{rev.comment}"</p>}
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center space-x-1">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{new Date(rev.createdAt).toLocaleDateString()}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()
        ) : (
          <div className="text-center py-12 text-gray-400 dark:text-gray-600 bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800">
            <BookOpen className="h-10 w-10 mx-auto mb-2" />
            <p className="text-sm">No reviews yet.</p>
          </div>
        )}
      </section>

      {/* Delete Account Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-950 rounded-3xl border border-gray-150 dark:border-slate-850 p-6 max-w-md w-full space-y-4 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
            <button
              onClick={() => {
                setDeleteModalOpen(false);
                setDeleteConfirmText('');
              }}
              type="button"
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-650 dark:hover:text-gray-250 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
            <h3 className="text-lg font-black font-outfit text-red-600 dark:text-red-400">Delete Account Permanently?</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              This will permanently delete your account, listings, and details. To confirm, please type <strong className="text-gray-900 dark:text-gray-100">DELETE</strong> below.
            </p>
            <input
              type="text"
              placeholder="Type DELETE to confirm"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="w-full bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-gray-100 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:border-red-500 text-sm font-semibold"
            />
            <div className="flex space-x-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setDeleteConfirmText('');
                }}
                className="px-4 py-2 border border-gray-200 dark:border-slate-700 text-gray-750 dark:text-gray-300 font-bold text-xs rounded-xl hover:bg-gray-50 dark:hover:bg-slate-850 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteConfirmText.toUpperCase() !== 'DELETE' || deleting}
                onClick={handleDeleteAccount}
                className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    <span>Yes, Delete Account</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Profile;

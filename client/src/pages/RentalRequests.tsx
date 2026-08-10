import React, { useEffect, useState } from 'react';
import { rentalService } from '../services/rentalService';
import { reviewService } from '../services/reviewService';
import { Link } from 'react-router-dom';
import { Clock, CheckCircle2, XCircle, Package, Star, MessageCircle, ArrowRight } from 'lucide-react';

const statusColors: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
  ACCEPTED: 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400',
  ACTIVE: 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400',
  COMPLETED: 'bg-gray-50 text-gray-700 dark:bg-slate-800 dark:text-gray-400',
  REJECTED: 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400',
  CANCELLED: 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400',
};

export const RentalRequests: React.FC = () => {
  const [tab, setTab] = useState<'incoming' | 'sent'>('incoming');
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [reviewModal, setReviewModal] = useState<any>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = tab === 'incoming'
        ? await rentalService.getIncomingRequests()
        : await rentalService.getSentRequests();
      if (res.data?.success) setRequests(res.data.requests);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchRequests(); }, [tab]);

  const handleAction = async (id: string, action: string) => {
    setActionLoading(id + action);
    try {
      if (action === 'accept') await rentalService.acceptRentalRequest(id);
      if (action === 'reject') await rentalService.rejectRentalRequest(id);
      if (action === 'cancel') await rentalService.cancelRentalRequest(id);
      if (action === 'handover') await rentalService.handoverRentalRequest(id);
      if (action === 'complete') await rentalService.completeRentalRequest(id);
      await fetchRequests();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Action failed. Please try again.');
    } finally {
      setActionLoading('');
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewLoading(true);
    try {
      await reviewService.createReview({
        rentalRequestId: reviewModal.id,
        rating: reviewRating,
        comment: reviewComment,
      });
      setReviewModal(null);
      setReviewComment('');
      setReviewRating(5);
      await fetchRequests();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Could not submit review.');
    } finally {
      setReviewLoading(false);
    }
  };

  const RequestCard = ({ req }: { req: any }) => {
    const isIncoming = tab === 'incoming';
    const otherUser = isIncoming ? req.renter : req.owner;
    const listing = req.listing;

    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 p-5 flex flex-col sm:flex-row gap-4 hover:shadow-md transition-all">
        <img
          src={listing?.images?.[0] || 'https://picsum.photos/150/150'}
          alt={listing?.title}
          className="h-24 w-24 sm:h-20 sm:w-20 rounded-2xl object-cover flex-shrink-0 border border-gray-100 dark:border-slate-800"
        />
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between flex-wrap gap-2">
            <Link to={`/listing/${listing?._id}`} className="font-bold text-gray-900 dark:text-gray-100 hover:text-primary-600 transition-colors text-sm leading-tight">
              {listing?.title}
            </Link>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusColors[req.status]}`}>
              {req.status}
            </span>
          </div>
          <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
            <img src={otherUser?.avatar} alt={otherUser?.fullName} className="h-5 w-5 rounded-full" />
            <span>{isIncoming ? 'from' : 'to'} <strong>{otherUser?.fullName}</strong></span>
            <span>·</span>
            <Clock className="h-3.5 w-3.5" />
            <span>{new Date(req.startDate).toLocaleDateString()} – {new Date(req.endDate).toLocaleDateString()}</span>
          </div>
          {req.message && <p className="text-xs text-gray-400 dark:text-gray-500 italic">"{req.message}"</p>}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-1">
            {isIncoming && req.status === 'PENDING' && (
              <>
                <button
                  onClick={() => handleAction(req._id, 'accept')}
                  disabled={actionLoading === req._id + 'accept'}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Accept</span>
                </button>
                <button
                  onClick={() => handleAction(req._id, 'reject')}
                  disabled={actionLoading === req._id + 'reject'}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  <span>Decline</span>
                </button>
              </>
            )}
            {isIncoming && req.status === 'ACCEPTED' && (
              <button
                onClick={() => handleAction(req._id, 'handover')}
                disabled={actionLoading === req._id + 'handover'}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50"
              >
                <Package className="h-3.5 w-3.5" />
                <span>Confirm Handover</span>
              </button>
            )}
            {isIncoming && req.status === 'ACTIVE' && (
              <button
                onClick={() => handleAction(req._id, 'complete')}
                disabled={actionLoading === req._id + 'complete'}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Mark Completed</span>
              </button>
            )}
            {(req.status === 'PENDING' || req.status === 'ACCEPTED') && (
              <button
                onClick={() => handleAction(req._id, 'cancel')}
                disabled={actionLoading === req._id + 'cancel'}
                className="flex items-center space-x-1.5 px-3 py-1.5 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 text-xs font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
              >
                <XCircle className="h-3.5 w-3.5" />
                <span>Cancel</span>
              </button>
            )}
            {req.status === 'COMPLETED' && (
              <button
                onClick={() => setReviewModal({ id: req._id, reviewee: isIncoming ? req.renter : req.owner })}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-all"
              >
                <Star className="h-3.5 w-3.5" />
                <span>Leave Review</span>
              </button>
            )}
            {(req.status === 'ACCEPTED' || req.status === 'ACTIVE') && (
              <Link
                to="/messages"
                className="flex items-center space-x-1.5 px-3 py-1.5 border border-primary-200 dark:border-primary-800 text-primary-600 dark:text-primary-400 text-xs font-bold rounded-xl hover:bg-primary-50 dark:hover:bg-primary-950/20 transition-all"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span>Chat</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black font-outfit text-gray-900 dark:text-gray-100">Rental Requests</h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Manage incoming requests and track your rentals</p>
      </div>

      {/* Tabs */}
      <div className="flex border border-gray-200 dark:border-slate-700 rounded-2xl p-1 bg-white dark:bg-slate-900 w-fit">
        {(['incoming', 'sent'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-xl text-sm font-bold transition-all capitalize ${
              tab === t
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 p-5 flex gap-4">
              <div className="h-20 w-20 bg-gray-100 dark:bg-slate-800 rounded-2xl flex-shrink-0"></div>
              <div className="flex-1 space-y-3">
                <div className="h-4 bg-gray-100 dark:bg-slate-800 rounded-full w-2/3"></div>
                <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded-full w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : requests.length > 0 ? (
        <div className="space-y-4">
          {requests.map((req) => <RequestCard key={req._id} req={req} />)}
        </div>
      ) : (
        <div className="text-center py-16">
          <Package className="h-16 w-16 mx-auto text-gray-200 dark:text-gray-700 mb-4" />
          <p className="font-bold text-gray-500 dark:text-gray-400">No {tab} requests yet</p>
          {tab === 'sent' && (
            <Link to="/explore" className="mt-3 inline-flex items-center space-x-1 text-sm text-primary-600 dark:text-primary-400 font-bold">
              <span>Browse listings</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      )}

      {/* Review Modal */}
      {reviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md shadow-2xl border border-gray-100 dark:border-slate-800">
            <h3 className="text-lg font-black font-outfit mb-2">Leave a Review</h3>
            <p className="text-sm text-gray-400 dark:text-gray-500 mb-5">
              Reviewing <strong className="text-gray-700 dark:text-gray-300">{reviewModal.reviewee?.fullName}</strong>
            </p>
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Rating</label>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setReviewRating(n)}
                      className={`text-2xl transition-transform hover:scale-110 ${reviewRating >= n ? 'text-amber-400' : 'text-gray-200 dark:text-gray-600'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Comment (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="How was the experience?"
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-gray-100 px-4 py-3 rounded-2xl border border-gray-200 dark:border-slate-700 text-sm resize-none focus:outline-none focus:border-primary-500"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setReviewModal(null)}
                  className="flex-1 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 font-bold py-2.5 rounded-2xl text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewLoading}
                  className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 rounded-2xl text-sm disabled:opacity-50 flex items-center justify-center"
                >
                  {reviewLoading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div> : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default RentalRequests;

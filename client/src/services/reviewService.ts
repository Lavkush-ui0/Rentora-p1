import api from './api';

export const reviewService = {
  createReview: (data: { rentalRequestId: string; rating: number; comment?: string }) =>
    api.post('/reviews', data),
  getUserReviews: (userId: string) => api.get(`/reviews/user/${userId}`),
};

export default reviewService;

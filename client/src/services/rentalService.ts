import api from './api';

export const rentalService = {
  createRentalRequest: (data: any) => api.post('/rental-requests', data),
  getIncomingRequests: () => api.get('/rental-requests/incoming'),
  getSentRequests: () => api.get('/rental-requests/sent'),
  getRentalRequestById: (id: string) => api.get(`/rental-requests/${id}`),
  acceptRentalRequest: (id: string) => api.patch(`/rental-requests/${id}/accept`),
  rejectRentalRequest: (id: string, reason?: string) => api.patch(`/rental-requests/${id}/reject`, { reason }),
  cancelRentalRequest: (id: string) => api.patch(`/rental-requests/${id}/cancel`),
  handoverRentalRequest: (id: string, otp?: string) => api.patch(`/rental-requests/${id}/handover`, { otp }),
  completeRentalRequest: (id: string, otp?: string) => api.patch(`/rental-requests/${id}/complete`, { otp }),
};

export default rentalService;

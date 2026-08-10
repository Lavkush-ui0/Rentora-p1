import api from './api';

export const rentalService = {
  createRentalRequest: (data: any) => api.post('/rental-requests', data),
  getIncomingRequests: () => api.get('/rental-requests/incoming'),
  getSentRequests: () => api.get('/rental-requests/sent'),
  getRentalRequestById: (id: string) => api.get(`/rental-requests/${id}`),
  acceptRentalRequest: (id: string) => api.patch(`/rental-requests/${id}/accept`),
  rejectRentalRequest: (id: string) => api.patch(`/rental-requests/${id}/reject`),
  cancelRentalRequest: (id: string) => api.patch(`/rental-requests/${id}/cancel`),
  handoverRentalRequest: (id: string) => api.patch(`/rental-requests/${id}/handover`),
  completeRentalRequest: (id: string) => api.patch(`/rental-requests/${id}/complete`),
};

export default rentalService;

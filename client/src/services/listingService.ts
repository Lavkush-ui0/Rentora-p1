import api from './api';

export const listingService = {
  createListing: (formData: FormData) =>
    api.post('/listings', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  
  updateListing: (id: string, formData: FormData) =>
    api.patch(`/listings/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  getListings: (params: any = {}) => api.get('/listings', { params }),
  
  getListingById: (id: string) => api.get(`/listings/${id}`),
  
  deleteListing: (id: string) => api.delete(`/listings/${id}`),
  
  togglePauseListing: (id: string) => api.post(`/listings/${id}/pause`),
  
  incrementViewCount: (id: string) => api.post(`/listings/${id}/view`),
};

export default listingService;

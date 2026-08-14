import apiClient from './api';

export const discoveryService = {
  getHomepageData: (params: any = {}) => apiClient.get('/discovery/home', { params }),
  getFeatured: () => apiClient.get('/discovery/featured'),
};

import apiClient from './api';

export const discoveryService = {
  getHomepageData: () => apiClient.get('/discovery/home'),
  getFeatured: () => apiClient.get('/discovery/featured'),
};

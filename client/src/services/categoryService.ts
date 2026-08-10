import apiClient from './api';

/**
 * Category service — uses the PUBLIC /categories endpoint
 * accessible to all users (not just admins).
 */
export const categoryService = {
  getCategories: () => apiClient.get('/categories'),
};

export default categoryService;

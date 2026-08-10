import api from './api';

export const adminService = {
  getUsers: () => api.get('/admin/users'),
  blockUser: (id: string) => api.patch(`/admin/users/${id}/block`),
  unblockUser: (id: string) => api.patch(`/admin/users/${id}/unblock`),
  
  getListings: () => api.get('/admin/listings'),
  removeListing: (id: string) => api.delete(`/admin/listings/${id}`),
  
  getCategories: () => api.get('/admin/categories'),
  createCategory: (data: any) => api.post('/admin/categories', data),
  updateCategory: (id: string, data: any) => api.patch(`/admin/categories/${id}`, data),
  
  getReports: () => api.get('/admin/reports'),
  updateReportStatus: (id: string, status: string) => api.patch(`/admin/reports/${id}`, { status }),
  submitReport: (data: { targetType: string; targetId: string; reason: string; description?: string }) =>
    api.post('/reports', data),
};

export default adminService;

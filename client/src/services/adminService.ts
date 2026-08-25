import api from './api';

export const adminService = {
  getUsers: () => api.get('/admin/users'),
  blockUser: (id: string) => api.patch(`/admin/users/${id}/block`),
  unblockUser: (id: string) => api.patch(`/admin/users/${id}/unblock`),

  getListings: () => api.get('/admin/listings'),
  removeListing: (id: string) => api.delete(`/admin/listings/${id}`),

  // Listing Approvals
  getPendingListings: () => api.get('/admin/listings/pending'),
  approveListing: (id: string) => api.patch(`/admin/listings/${id}/approve`),
  rejectListing: (id: string, reason: string) => api.patch(`/admin/listings/${id}/reject`, { reason }),

  getCategories: () => api.get('/admin/categories'),
  createCategory: (data: any) => api.post('/admin/categories', data),
  updateCategory: (id: string, data: any) => api.patch(`/admin/categories/${id}`, data),

  getReports: () => api.get('/admin/reports'),
  updateReportStatus: (id: string, status: string) => api.patch(`/admin/reports/${id}`, { status }),
  submitReport: (data: { targetType: string; targetId: string; reason: string; description?: string }) =>
    api.post('/reports', data),
  getDashboardStats: () => api.get('/admin/stats'),
};

export default adminService;

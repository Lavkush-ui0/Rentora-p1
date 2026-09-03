import api from './api';

export const adminService = {
  getUsers: () => api.get('/admin/users'),
  blockUser: (id: string) => api.patch(`/admin/users/${id}/block`),
  unblockUser: (id: string) => api.patch(`/admin/users/${id}/unblock`),
  toggleBlockUser: (id: string) => api.patch(`/admin/users/${id}/toggle-block`),

  getListings: () => api.get('/admin/listings'),
  removeListing: (id: string) => api.delete(`/admin/listings/${id}`),
  pauseListing: (id: string, reason?: string) => api.patch(`/admin/listings/${id}/pause`, { reason }),
  resumeListing: (id: string) => api.patch(`/admin/listings/${id}/resume`),

  // Listing Approvals
  getPendingListings: () => api.get('/admin/listings/pending'),
  getRejectedTodayListings: () => api.get('/admin/listings/rejected-today'),
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

  // AI Moderation Shield & Platform Settings
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (data: { aiModerationEnabled?: boolean; dailyListingLimit?: number }) =>
    api.patch('/admin/settings', data),

  // Create User / Admin Accounts
  createUser: (data: {
    fullName: string;
    email: string;
    password: string;
    role: 'ADMIN' | 'STUDENT';
    course?: string;
    branch?: string;
    year?: number;
    collegeName?: string;
  }) => api.post('/admin/users/create', data),

  // Admin Role Privilege Management (Guarded by Master OTP at rentora2611@gmail.com)
  requestAdminRoleChangeOTP: (data: { targetUserId: string; newRole: 'ADMIN' | 'STUDENT' }) =>
    api.post('/admin/roles/request-otp', data),
  verifyAndUpdateAdminRole: (data: { targetUserId: string; newRole: 'ADMIN' | 'STUDENT'; otp: string }) =>
    api.post('/admin/roles/verify-and-update', data),
};

export default adminService;

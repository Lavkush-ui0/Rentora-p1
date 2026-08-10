import api from './api';

export const notificationService = {
  getNotifications: () => api.get('/notifications'),
  markAllAsRead: () => api.patch('/notifications/mark-read'),
  markOneAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
};

export default notificationService;

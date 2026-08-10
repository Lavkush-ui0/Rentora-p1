import api from './api';

export const authService = {
  login: (credentials: any) => api.post('/auth/login', credentials),
  register: (data: any) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  getProfileById: (id: string) => api.get(`/auth/profile/${id}`),
  updateProfile: (data: any) => api.patch('/auth/profile', data),
};

export default authService;

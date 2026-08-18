import axios from 'axios';

const getBaseUrl = (): string => {
  const rawUrl = (import.meta.env.VITE_API_URL as string)?.trim() || 'http://localhost:5001/api';
  const cleanUrl = rawUrl.replace(/\/+$/, '');
  return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
};

const api = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true, // Allows browser to exchange HTTP-only refresh cookies
});

let accessToken = localStorage.getItem('accessToken') || '';

export const setAccessToken = (token: string) => {
  accessToken = token;
  if (token) {
    localStorage.setItem('accessToken', token);
  } else {
    localStorage.removeItem('accessToken');
  }
};

export const getAccessToken = () => accessToken;

// Automatically inject access token in Authorization headers
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercept unauthorized requests and attempt silent token refreshing
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Check if unauthorized, not retried yet, and not already trying to refresh or log in
    if (
      error.response?.status === 401 && 
      !originalRequest._retry && 
      originalRequest.url !== '/auth/refresh-token' &&
      originalRequest.url !== '/auth/login' &&
      getAccessToken()
    ) {
      originalRequest._retry = true;
      try {
        console.log('[Axios Interceptor] Token expired. Attempting refresh...');
        const res = await axios.post(
          `${api.defaults.baseURL}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );
        
        const { accessToken: newToken } = res.data;
        setAccessToken(newToken);
        
        // Re-run original request with new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.warn('[Axios Interceptor] Refresh failed. Logging out user...');
        setAccessToken('');
        window.dispatchEvent(new Event('auth_logout'));
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;

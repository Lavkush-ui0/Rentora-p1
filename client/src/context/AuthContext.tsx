import React, { createContext, useContext, useEffect, useState } from 'react';
import api, { setAccessToken } from '../services/api';

interface UserType {
  id: string;
  fullName: string;
  email: string;
  role: 'STUDENT' | 'ADMIN';
  course: string;
  branch: string;
  year: number;
  avatar: string;
  bio?: string;
  ratingAverage: number;
  completedRentals: number;
  isBlocked?: boolean;
}

interface AuthContextType {
  user: UserType | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  registerUser: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize and verify session on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Try to fetch profile (this triggers Axios interceptor and refreshes token if needed)
        const response = await api.get('/auth/profile');
        if (response.data?.success) {
          setUser(response.data.user);
        }
      } catch (error) {
        console.log('[Auth Context] No active session found.');
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for logout event triggered by Axios interceptor on 401 refresh failure
    const handleLogoutEvent = () => {
      setUser(null);
    };

    window.addEventListener('auth_logout', handleLogoutEvent);
    return () => {
      window.removeEventListener('auth_logout', handleLogoutEvent);
    };
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data?.success) {
        setAccessToken(response.data.accessToken);
        setUser(response.data.user);
      }
    } finally {
      setLoading(false);
    }
  };

  const registerUser = async (data: any) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/register', data);
      if (response.data?.success) {
        setAccessToken(response.data.accessToken);
        setUser(response.data.user);
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.warn('[Auth Context] Logout endpoint failed:', e);
    } finally {
      setAccessToken('');
      setUser(null);
      setLoading(false);
    }
  };

  const updateUser = async (data: any) => {
    const response = await api.patch('/auth/profile', data);
    if (response.data?.success) {
      setUser(response.data.user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        registerUser,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
export default AuthContext;

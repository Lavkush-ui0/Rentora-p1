import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext';
import { WishlistProvider } from './context/WishlistContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import MainLayout from './layouts/MainLayout';

// Public pages
import Login from './pages/Login';
import Register from './pages/Register';

// Protected student pages
import Home from './pages/Home';
import Explore from './pages/Explore';
import ListingDetails from './pages/ListingDetails';
import ListItem from './pages/ListItem';
import MyListings from './pages/MyListings';
import RentalRequests from './pages/RentalRequests';
import Messages from './pages/Messages';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import Wishlist from './pages/Wishlist';

// Admin pages
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <WishlistProvider>
            <SocketProvider>
              <Routes>
                {/* Public auth routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Redirect root to home */}
                <Route path="/" element={<Navigate to="/home" replace />} />

                {/* Main marketplace routes */}
                <Route
                  path="/home"
                  element={
                    <MainLayout>
                      <Home />
                    </MainLayout>
                  }
                />

                <Route
                  path="/explore"
                  element={
                    <MainLayout>
                      <Explore />
                    </MainLayout>
                  }
                />

                <Route
                  path="/wishlist"
                  element={
                    <MainLayout>
                      <Wishlist />
                    </MainLayout>
                  }
                />

                <Route
                  path="/cart"
                  element={<Navigate to="/wishlist" replace />}
                />

                <Route
                  path="/listing/:id"
                  element={
                    <MainLayout>
                      <ListingDetails />
                    </MainLayout>
                  }
                />

                <Route
                  path="/list-item"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <ListItem />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/my-listings"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <MyListings />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/my-rentals"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <RentalRequests />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/rental-requests"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <RentalRequests />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/messages"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <Messages />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/messages/:conversationId"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <Messages />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <Profile />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/profile/:id"
                  element={
                    <MainLayout>
                      <Profile />
                    </MainLayout>
                  }
                />

                <Route
                  path="/notifications"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <Notifications />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <Settings />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />

                {/* Admin-only routes */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route
                  path="/admin"
                  element={<Navigate to="/admin/dashboard" replace />}
                />
                <Route
                  path="/admin/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/listings"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/approvals"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/categories"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/reports"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />


                {/* 404 fallback */}
                <Route
                  path="*"
                  element={
                    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-950">
                      <div className="text-center">
                        <p className="text-8xl font-black text-primary-200 dark:text-primary-900 font-outfit">404</p>
                        <h2 className="text-2xl font-black font-outfit text-gray-900 dark:text-gray-100 mt-2">Page Not Found</h2>
                        <p className="text-gray-400 dark:text-gray-500 mt-2 mb-6">This page doesn't exist on Rentora.</p>
                        <a href="/home" className="bg-primary-600 hover:bg-primary-700 text-white font-bold px-6 py-3 rounded-2xl shadow-sm transition-all inline-block">
                          Back to Home
                        </a>
                      </div>
                    </div>
                  }
                />
              </Routes>
            </SocketProvider>
          </WishlistProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;

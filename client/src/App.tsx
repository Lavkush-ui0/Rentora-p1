import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext';
import { WishlistProvider } from './context/WishlistContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import MainLayout from './layouts/MainLayout';

// Public pages (lazy loaded)
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsAndConditions = lazy(() => import('./pages/TermsAndConditions'));

// Protected student pages (lazy loaded)
const Home = lazy(() => import('./pages/Home'));
const Explore = lazy(() => import('./pages/Explore'));
const ListingDetails = lazy(() => import('./pages/ListingDetails'));
const ListItem = lazy(() => import('./pages/ListItem'));
const MyListings = lazy(() => import('./pages/MyListings'));
const RentalRequests = lazy(() => import('./pages/RentalRequests'));
const Messages = lazy(() => import('./pages/Messages'));
const Profile = lazy(() => import('./pages/Profile'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Settings = lazy(() => import('./pages/Settings'));
const Wishlist = lazy(() => import('./pages/Wishlist'));

// Admin pages (lazy loaded)
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <WishlistProvider>
            <SocketProvider>
              <Suspense fallback={
                <div className="flex h-screen w-screen items-center justify-center bg-[#FAF7F2] dark:bg-[#161B22] transition-colors duration-200">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#9E1B1B] border-t-transparent"></div>
                </div>
              }>
                <Routes>
                  {/* Public auth routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route
                    path="/privacy"
                    element={
                      <MainLayout>
                        <PrivacyPolicy />
                      </MainLayout>
                    }
                  />
                  <Route
                    path="/privacy-policy"
                    element={
                      <MainLayout>
                        <PrivacyPolicy />
                      </MainLayout>
                    }
                  />
                  <Route
                    path="/terms"
                    element={
                      <MainLayout>
                        <TermsAndConditions />
                      </MainLayout>
                    }
                  />
                  <Route
                    path="/terms-and-conditions"
                    element={
                      <MainLayout>
                        <TermsAndConditions />
                      </MainLayout>
                    }
                  />

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
                    path="/edit-item/:id"
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
                    path="/admin/rejected"
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
              </Suspense>
            </SocketProvider>
          </WishlistProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;

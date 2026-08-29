import { Router } from 'express';
import {
  getUsers,
  createUserByAdmin,
  blockUser,
  unblockUser,
  toggleBlockUser,
  getListings,
  removeListing,
  pauseListing,
  resumeListing,
  getPendingListings,
  approveListing,
  rejectListing,
  getRejectedTodayListings,
  getCategories,
  createCategory,
  updateCategory,
  getReports,
  updateReportStatus,
  getDashboardStats,
  getAdminSettings,
  updateAdminSettings,
  requestAdminRoleChangeOTP,
  verifyAndUpdateAdminRole,
} from '../controllers/admin.controller';
import { authenticateUser, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Secure all admin routes with authentication and admin authorization
router.use(authenticateUser, requireAdmin);

// Users Dashboard
router.get('/users', getUsers);
router.post('/users/create', createUserByAdmin);
router.patch('/users/:id/block', blockUser);
router.patch('/users/:id/unblock', unblockUser);
router.patch('/users/:id/toggle-block', toggleBlockUser);

// Admin Role Privilege Management (Guarded by Master OTP at rentora2611@gmail.com)
router.post('/roles/request-otp', requestAdminRoleChangeOTP);
router.post('/roles/verify-and-update', verifyAndUpdateAdminRole);

// Listings Dashboard
router.get('/listings', getListings);
router.delete('/listings/:id', removeListing);
router.patch('/listings/:id/pause', pauseListing);
router.patch('/listings/:id/resume', resumeListing);

// Listing Approvals
router.get('/listings/pending', getPendingListings);
router.get('/listings/rejected-today', getRejectedTodayListings);
router.patch('/listings/:id/approve', approveListing);
router.patch('/listings/:id/reject', rejectListing);

// Categories Management
router.get('/categories', getCategories);
router.post('/categories', createCategory);
router.patch('/categories/:id', updateCategory);

// Reports Management
router.get('/reports', getReports);
router.patch('/reports/:id', updateReportStatus);

// Statistics & Platform Settings
router.get('/stats', getDashboardStats);
router.get('/settings', getAdminSettings);
router.patch('/settings', updateAdminSettings);

export default router;

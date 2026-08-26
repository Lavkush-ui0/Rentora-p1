import { Router } from 'express';
import {
  getUsers,
  createUserByAdmin,
  blockUser,
  unblockUser,
  getListings,
  removeListing,
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

// Listings Dashboard
router.get('/listings', getListings);
router.delete('/listings/:id', removeListing);

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

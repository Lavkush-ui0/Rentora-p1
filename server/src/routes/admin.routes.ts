import { Router } from 'express';
import {
  getUsers,
  blockUser,
  unblockUser,
  getListings,
  removeListing,
  getCategories,
  createCategory,
  updateCategory,
  getReports,
  updateReportStatus,
  getDashboardStats,
} from '../controllers/admin.controller';
import { authenticateUser, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Secure all admin routes with authentication and admin authorization
router.use(authenticateUser, requireAdmin);

// Users Dashboard
router.get('/users', getUsers);
router.patch('/users/:id/block', blockUser);
router.patch('/users/:id/unblock', unblockUser);

// Listings Dashboard
router.get('/listings', getListings);
router.delete('/listings/:id', removeListing);

// Categories Management
router.get('/categories', getCategories);
router.post('/categories', createCategory);
router.patch('/categories/:id', updateCategory);

// Reports Management
router.get('/reports', getReports);
router.patch('/reports/:id', updateReportStatus);

// Statistics
router.get('/stats', getDashboardStats);

export default router;

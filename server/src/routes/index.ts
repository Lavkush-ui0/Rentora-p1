import { Router } from 'express';
import authRoutes from './auth.routes';
import listingRoutes from './listing.routes';
import rentalRoutes from './rental.routes';
import chatRoutes from './chat.routes';
import reviewRoutes from './review.routes';
import notificationRoutes from './notification.routes';
import adminRoutes from './admin.routes';
import discoveryRoutes from './discovery.routes';
import reportRoutes from './report.routes';
import categoryRoutes from './category.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/listings', listingRoutes);
router.use('/rental-requests', rentalRoutes);
router.use('/conversations', chatRoutes);
router.use('/reviews', reviewRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);
router.use('/discovery', discoveryRoutes);
router.use('/reports', reportRoutes);
router.use('/categories', categoryRoutes);

export default router;

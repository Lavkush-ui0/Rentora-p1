import { Router } from 'express';
import {
  createListing,
  getListings,
  getListingById,
  updateListing,
  deleteListing,
  pauseListing,
  viewListing,
} from '../controllers/listing.controller';
import { authenticateUser } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';
import { validate } from '../middleware/validate';
import { createListingSchema, updateListingSchema, getListingsSchema } from '../validators/listing.validator';

const router = Router();

// Public routes
router.get('/', validate(getListingsSchema), getListings);
router.get('/:id', getListingById);
router.post('/:id/view', viewListing);

// Protected routes
router.post('/', authenticateUser, upload.array('images', 5), validate(createListingSchema), createListing);
router.patch('/:id', authenticateUser, upload.array('images', 5), validate(updateListingSchema), updateListing);
router.delete('/:id', authenticateUser, deleteListing);
router.post('/:id/pause', authenticateUser, pauseListing);

export default router;

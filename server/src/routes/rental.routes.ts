import { Router } from 'express';
import {
  createRentalRequest,
  getIncomingRequests,
  getSentRequests,
  getRentalRequestById,
  acceptRentalRequest,
  rejectRentalRequest,
  cancelRentalRequest,
  handoverRentalRequest,
  completeRentalRequest,
} from '../controllers/rental.controller';
import { authenticateUser } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import { createRentalRequestSchema } from '../validators/rental.validator';

const router = Router();

// All rental request routes are protected
router.use(authenticateUser);

router.post('/', validate(createRentalRequestSchema), createRentalRequest);
router.get('/incoming', getIncomingRequests);
router.get('/sent', getSentRequests);
router.get('/:id', getRentalRequestById);

router.patch('/:id/accept', acceptRentalRequest);
router.patch('/:id/reject', rejectRentalRequest);
router.patch('/:id/cancel', cancelRentalRequest);
router.patch('/:id/handover', handoverRentalRequest);
router.patch('/:id/complete', completeRentalRequest);

export default router;

import express from 'express';
import {
  bookSession,
  cancelBooking,
  getMyBookings,
} from '../controllers/bookingController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

// Member books a session
router.post('/', bookSession);

// Member views only their own bookings
router.get('/my', getMyBookings);

// Member cancels booking before session starts
router.post('/:id/cancel', cancelBooking);

export default router;

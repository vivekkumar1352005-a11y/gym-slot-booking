import express from 'express';
import {
  getSessionAttendees,
  checkInByCode,
  toggleAttendeeCheckIn,
} from '../controllers/adminController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate, requireAdmin);

// Admin views all attendees & waitlist for a session
router.get('/sessions/:sessionId/attendees', getSessionAttendees);

// Admin checks in member using 6-character short code
router.post('/check-in', checkInByCode);

// Admin manually toggles attendance for a member in roster
router.post('/bookings/:bookingId/toggle-checkin', toggleAttendeeCheckIn);

export default router;

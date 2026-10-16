import express from 'express';
import {
  joinWaitlist,
  leaveWaitlist,
} from '../controllers/waitlistController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

// Join waitlist for a full session
router.post('/', joinWaitlist);

// Leave waitlist
router.post('/:id/leave', leaveWaitlist);

export default router;

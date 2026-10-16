import express from 'express';
import {
  createSession,
  getSessions,
  getSessionById,
} from '../controllers/sessionController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Logged-in users can browse sessions and filter by date
router.get('/', authenticate, getSessions);
router.get('/:id', authenticate, getSessionById);

// Admin-only: create sessions
router.post('/', authenticate, requireAdmin, createSession);

export default router;

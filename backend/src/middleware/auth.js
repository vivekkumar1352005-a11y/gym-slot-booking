import jwt from 'jsonwebtoken';
import { User } from '../models/User.model.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-gym-jwt-key-2026-production-ready';

/**
 * Authentication middleware
 * Verifies Authorization: Bearer <token>
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication token required. Please log in.',
        code: 'UNAUTHENTICATED',
      });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (jwtErr) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired session token. Please log in again.',
        code: 'TOKEN_INVALID',
      });
    }

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User account not found or removed.',
        code: 'USER_NOT_FOUND',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Require admin role
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Access forbidden. Administrator privileges required.',
      code: 'FORBIDDEN',
    });
  }
  next();
};

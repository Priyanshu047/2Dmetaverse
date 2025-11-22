import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import { getProfile, updateMyProfile } from '../controllers/profileController';

const router = Router();

/**
 * @route   GET /api/profile/:userId
 * @desc    Get user profile by userId
 * @access  Public
 */
router.get('/:userId', getProfile);

/**
 * @route   PUT /api/profile/me
 * @desc    Update current user's profile
 * @access  Private
 */
router.put('/me', authenticate, updateMyProfile);

export default router;

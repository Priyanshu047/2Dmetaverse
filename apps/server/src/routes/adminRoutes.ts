import { Router } from 'express';
import {
    getUsers,
    changeUserRole,
    muteUser,
    unmuteUser,
    kickUser,
    lockRoom,
    unlockRoom,
    getModerationLogs,
} from '../controllers/adminController';
import { authenticate } from '../middleware/authMiddleware';
import { requireAdmin, requireModerator } from '../middleware/rolesMiddleware';

const router = Router();

/**
 * Admin Routes
 * All routes require authentication
 * Different endpoints require different role levels
 */

// User management routes
router.get('/users', authenticate, requireModerator, getUsers);
router.post('/users/:userId/role', authenticate, requireAdmin, changeUserRole);
router.post('/users/:userId/mute', authenticate, requireModerator, muteUser);
router.post('/users/:userId/unmute', authenticate, requireModerator, unmuteUser);
router.post('/users/:userId/kick', authenticate, requireModerator, kickUser);

// Room management routes
router.post('/rooms/:roomId/lock', authenticate, requireModerator, lockRoom);
router.post('/rooms/:roomId/unlock', authenticate, requireModerator, unlockRoom);

// Moderation logs (admin only)
router.get('/moderation-logs', authenticate, requireAdmin, getModerationLogs);

export default router;

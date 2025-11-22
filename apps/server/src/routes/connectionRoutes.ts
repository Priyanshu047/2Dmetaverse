import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import {
    sendConnectionRequest,
    respondToConnection,
    listConnections,
} from '../controllers/connectionController';

const router = Router();

/**
 * @route   POST /api/connections/request
 * @desc    Send a connection request
 * @access  Private
 */
router.post('/request', authenticate, sendConnectionRequest);

/**
 * @route   POST /api/connections/respond
 * @desc    Respond to a connection request (accept/reject)
 * @access  Private
 */
router.post('/respond', authenticate, respondToConnection);

/**
 * @route   GET /api/connections/list
 * @desc    Get all connections for current user
 * @access  Private
 */
router.get('/list', authenticate, listConnections);

export default router;

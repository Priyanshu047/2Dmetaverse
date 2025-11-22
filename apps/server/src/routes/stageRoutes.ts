import { Router } from 'express';
import {
    startPresenting,
    stopPresenting,
    getStageState,
    getStageToken,
    submitQuestion,
    getQuestions,
} from '../controllers/stageController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

/**
 * Stage API Routes
 * All routes require authentication
 */

// Presenter control routes
router.post('/:roomId/presenter/start', authenticate, startPresenting);
router.post('/:roomId/presenter/stop', authenticate, stopPresenting);

// Stage state
router.get('/:roomId/state', authenticate, getStageState);

// LiveKit token
router.post('/:roomId/token', authenticate, getStageToken);

// Q&A routes
router.post('/:roomId/questions', authenticate, submitQuestion);
router.get('/:roomId/questions', authenticate, getQuestions);

export default router;

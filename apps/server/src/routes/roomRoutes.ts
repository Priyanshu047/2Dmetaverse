import express from 'express';
import { getRooms, getRoom, createRoom } from '../controllers/roomController';
import { authenticate } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', getRooms);
router.get('/:idOrSlug', getRoom);

// Admin routes for creating/updating rooms
router.post('/', authenticate, createRoom);
// router.patch('/:id', updateRoom);

export default router;

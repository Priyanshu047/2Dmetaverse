import express from 'express';
import { getRooms, getRoom } from '../controllers/roomController';

const router = express.Router();

router.get('/', getRooms);
router.get('/:idOrSlug', getRoom);

// TODO: Admin routes for creating/updating rooms
// router.post('/', createRoom);
// router.patch('/:id', updateRoom);

export default router;

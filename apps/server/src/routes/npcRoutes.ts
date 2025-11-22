import { Router } from 'express';
import { chatWithNpc, getRoomNpcs } from '../controllers/npcController';

const router = Router();

// POST /api/npc/chat - Send message to NPC
router.post('/chat', chatWithNpc);

// GET /api/npc/:roomSlug - Get all NPCs for a room
router.get('/:roomSlug', getRoomNpcs);

export default router;

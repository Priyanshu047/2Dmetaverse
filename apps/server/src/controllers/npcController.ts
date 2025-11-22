import { Request, Response } from 'express';
import { processNpcChat, getNpcsForRoom } from '../services/npcService';
import type { NpcChatRequest } from '@metaverse/shared';

/**
 * POST /api/npc/chat
 * Send a message to an NPC and get a response
 */
export const chatWithNpc = async (req: Request, res: Response): Promise<void> => {
    try {
        const { roomSlug, npcName, userId, username, message, context }: NpcChatRequest = req.body;

        // Validate required fields
        if (!roomSlug || !npcName || !userId || !username || !message) {
            res.status(400).json({
                success: false,
                message: 'Missing required fields: roomSlug, npcName, userId, username, message'
            });
            return;
        }

        // Validate message length
        if (message.length > 500) {
            res.status(400).json({
                success: false,
                message: 'Message too long (max 500 characters)'
            });
            return;
        }

        // Process the chat request
        const response = await processNpcChat({
            roomSlug,
            npcName,
            userId,
            username,
            message,
            context
        });

        res.json({
            success: true,
            data: response
        });
    } catch (error: any) {
        console.error('NPC Chat Error:', error);

        // Handle specific error cases
        if (error.message === 'RATE_LIMIT_EXCEEDED') {
            res.status(429).json({
                success: false,
                message: 'Too many messages. Please wait a moment before trying again.',
                data: {
                    npcName: req.body.npcName,
                    displayName: req.body.npcName,
                    text: "I'm getting a lot of questions right now. Please give me a moment and try again.",
                    roomSlug: req.body.roomSlug
                }
            });
        }

        if (error.message.includes('not found')) {
            res.status(404).json({
                success: false,
                message: error.message
            });
        }

        // Generic error response with fallback message
        res.status(500).json({
            success: false,
            message: 'Failed to process NPC chat',
            data: {
                npcName: req.body.npcName,
                displayName: req.body.npcName,
                text: "I'm having trouble responding right now. Please try again later.",
                roomSlug: req.body.roomSlug
            }
        });
    }
};

/**
 * GET /api/npc/:roomSlug
 * Get all NPCs for a specific room
 */
export const getRoomNpcs = async (req: Request, res: Response): Promise<void> => {
    try {
        const { roomSlug } = req.params;

        const npcs = await getNpcsForRoom(roomSlug);

        res.json({
            success: true,
            data: { npcs }
        });
    } catch (error) {
        console.error('Get Room NPCs Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch NPCs'
        });
    }
};

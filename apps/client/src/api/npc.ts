import axios from 'axios';
import type { NpcChatRequest, NpcChatResponse, NpcConfig } from '@metaverse/shared';

const API_URL = 'http://localhost:3001/api';

/**
 * Send a message to an NPC and get a response
 */
export const chatWithNpc = async (request: NpcChatRequest): Promise<NpcChatResponse> => {
    try {
        const response = await axios.post<{ success: boolean; data: NpcChatResponse }>(
            `${API_URL}/npc/chat`,
            request
        );
        return response.data.data;
    } catch (error: any) {
        // If rate limited or other error, return fallback message
        if (error.response?.data?.data) {
            return error.response.data.data;
        }

        throw new Error(error.response?.data?.message || 'Failed to chat with NPC');
    }
};

/**
 * Get all NPCs for a specific room
 */
export const getRoomNpcs = async (roomSlug: string): Promise<NpcConfig[]> => {
    try {
        const response = await axios.get<{ success: boolean; data: { npcs: NpcConfig[] } }>(
            `${API_URL}/npc/${roomSlug}`
        );
        return response.data.data.npcs;
    } catch (error: any) {
        console.error('Failed to fetch room NPCs:', error);
        return [];
    }
};

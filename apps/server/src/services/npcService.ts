import { GoogleGenerativeAI } from '@google/generative-ai';
import { NpcConfig } from '../models/NpcConfig';
import type { NpcChatRequest, NpcChatResponse } from '@metaverse/shared';

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-pro';
const MAX_CONTEXT_MESSAGES = 5;
const REQUEST_TIMEOUT_MS = 10000;

// In-memory rate limiting
interface RateLimitEntry {
    count: number;
    resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Check if user has exceeded rate limit for this NPC
 */
export const checkRateLimit = (
    roomSlug: string,
    npcName: string,
    userId: string,
    maxPerMinute: number
): boolean => {
    const key = `${roomSlug}:${npcName}:${userId}`;
    const now = Date.now();
    const entry = rateLimitStore.get(key);

    if (!entry || now > entry.resetAt) {
        // Reset or create new entry
        rateLimitStore.set(key, {
            count: 1,
            resetAt: now + 60000 // 1 minute from now
        });
        return true;
    }

    if (entry.count >= maxPerMinute) {
        return false; // Rate limit exceeded
    }

    entry.count++;
    return true;
};

/**
 * Build the prompt for Gemini
 */
const buildNpcPrompt = (
    npcConfig: any,
    request: NpcChatRequest
): string => {
    let prompt = `${npcConfig.systemPrompt}\n\n`;
    prompt += `You are ${npcConfig.displayName}, a ${npcConfig.role.toLowerCase()} in the ${request.roomSlug} room of a virtual metaverse.\n`;
    prompt += `Current context:\n`;
    prompt += `- Room type: ${request.context?.roomType || 'unknown'}\n`;
    prompt += `- Time: ${request.context?.timeOfDay || 'daytime'}\n\n`;

    prompt += `Guidelines:\n`;
    prompt += `- Keep responses concise (2-3 sentences max)\n`;
    prompt += `- Be helpful and friendly\n`;
    prompt += `- Stay in character as a ${npcConfig.role.toLowerCase()}\n`;
    prompt += `- Reference the room and metaverse context when relevant\n`;
    prompt += `- If you don't know something, admit it politely\n\n`;

    // Add recent conversation history for context (truncated)
    if (request.context?.recentMessages && request.context.recentMessages.length > 0) {
        const recentMessages = request.context.recentMessages.slice(-MAX_CONTEXT_MESSAGES);
        prompt += `Recent conversation:\n`;
        recentMessages.forEach((msg: any) => {
            prompt += `${msg.from}: ${msg.text}\n`;
        });
        prompt += `\n`;
    }

    // Add current user message
    prompt += `${request.username} asks: ${request.message}\n\n`;
    prompt += `Your response:`;

    return prompt;
};

/**
 * Call Gemini API with timeout and error handling
 */
const callGemini = async (prompt: string): Promise<string> => {
    try {
        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

        const result = await Promise.race([
            model.generateContent(prompt),
            new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Gemini request timeout')), REQUEST_TIMEOUT_MS)
            )
        ]);

        const response = await result.response;
        const responseText = response.text().trim();

        if (!responseText) {
            throw new Error('Empty response from Gemini');
        }

        // Truncate very long responses
        if (responseText.length > 500) {
            return responseText.substring(0, 497) + '...';
        }

        return responseText;
    } catch (error: any) {
        console.error('Gemini API Error:', error.message);
        throw error;
    }
};

/**
 * Sanitize and validate the response
 */
const sanitizeResponse = (text: string): string => {
    // Remove any potential harmful content
    let sanitized = text.trim();

    // Remove excessive whitespace
    sanitized = sanitized.replace(/\s+/g, ' ');

    // Basic profanity filter (extend as needed)
    const blockedWords = ['offensive', 'inappropriate']; // Add actual words
    blockedWords.forEach(word => {
        const regex = new RegExp(word, 'gi');
        sanitized = sanitized.replace(regex, '***');
    });

    return sanitized;
};

/**
 * Main service function to process NPC chat
 */
export const processNpcChat = async (
    request: NpcChatRequest
): Promise<NpcChatResponse> => {
    // 1. Fetch NPC config from database
    const npcConfig = await NpcConfig.findOne({
        roomSlug: request.roomSlug,
        name: request.npcName,
        active: true
    });

    if (!npcConfig) {
        throw new Error(`NPC "${request.npcName}" not found in room "${request.roomSlug}"`);
    }

    // 2. Check rate limit
    const withinLimit = checkRateLimit(
        request.roomSlug,
        request.npcName,
        request.userId,
        npcConfig.maxMessagesPerMinute
    );

    if (!withinLimit) {
        throw new Error('RATE_LIMIT_EXCEEDED');
    }

    // 3. Build prompt
    const prompt = buildNpcPrompt(npcConfig, request);

    // 4. Call Gemini
    let responseText: string;
    try {
        responseText = await callGemini(prompt);
    } catch (error: any) {
        // Fallback message on API error
        console.error('Failed to get Gemini response:', error);
        responseText = "I'm having trouble responding right now. Please try again in a moment.";
    }

    // 5. Sanitize response
    const sanitizedText = sanitizeResponse(responseText);

    // 6. Return formatted response
    return {
        npcName: npcConfig.name,
        displayName: npcConfig.displayName,
        text: sanitizedText,
        roomSlug: request.roomSlug
    };
};

/**
 * Get all NPCs for a room
 */
export const getNpcsForRoom = async (roomSlug: string) => {
    return await NpcConfig.find({ roomSlug, active: true });
};

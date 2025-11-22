import { AccessToken } from 'livekit-server-sdk';
import { config } from '../config/env';

/**
 * LiveKit service for generating access tokens
 * Provides role-based tokens for stage presenters and audience
 */

export type StageUserRole = 'presenter' | 'audience';

export interface LiveKitTokenParams {
    userId: string;
    roomId: string;
    role: StageUserRole;
    username?: string;
}

export interface LiveKitTokenResponse {
    token: string;
    url: string;
}

/**
 * Create a LiveKit access token for a user
 * @param params Token parameters including user ID, room ID, and role
 * @returns Token and server URL for LiveKit client connection
 */
export const createStageToken = async (
    params: LiveKitTokenParams
): Promise<LiveKitTokenResponse> => {
    const { userId, roomId, role, username } = params;

    // Validate LiveKit configuration
    if (!config.livekit.apiKey || !config.livekit.apiSecret || !config.livekit.url) {
        throw new Error(
            'LiveKit credentials not configured. Please set LIVEKIT_API_KEY, LIVEKIT_API_SECRET, and LIVEKIT_URL in environment variables.'
        );
    }

    // Create access token
    const at = new AccessToken(config.livekit.apiKey, config.livekit.apiSecret, {
        identity: userId,
        name: username || userId,
        // Token valid for 2 hours
        ttl: '2h',
    });

    // Set permissions based on role
    if (role === 'presenter') {
        // Presenter can publish and subscribe
        at.addGrant({
            roomJoin: true,
            room: roomId,
            canPublish: true,
            canSubscribe: true,
            canPublishData: true,
        });
    } else {
        // Audience can only subscribe
        at.addGrant({
            roomJoin: true,
            room: roomId,
            canPublish: false,
            canSubscribe: true,
            canPublishData: false,
        });
    }

    // Generate JWT token
    const token = await at.toJwt();

    return {
        token,
        url: config.livekit.url,
    };
};

/**
 * Create a LiveKit token with elevated permissions for co-presenters
 * Used when audience member is granted microphone access
 */
export const createCoPresenterToken = async (
    params: LiveKitTokenParams
): Promise<LiveKitTokenResponse> => {
    const { userId, roomId, username } = params;

    if (!config.livekit.apiKey || !config.livekit.apiSecret || !config.livekit.url) {
        throw new Error('LiveKit credentials not configured.');
    }

    const at = new AccessToken(config.livekit.apiKey, config.livekit.apiSecret, {
        identity: userId,
        name: username || userId,
        ttl: '1h', // Shorter TTL for co-presenters
    });

    // Co-presenter can publish audio only
    at.addGrant({
        roomJoin: true,
        room: roomId,
        canPublish: true, // Can publish audio
        canSubscribe: true,
        canPublishData: true,
    });

    const token = await at.toJwt();

    return {
        token,
        url: config.livekit.url,
    };
};

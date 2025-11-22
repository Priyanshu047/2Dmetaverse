import { Request } from 'express';

/**
 * Extended Express Request interface with authenticated user
 */
export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        username: string;
        role: 'user' | 'admin';
    };
}

/**
 * Avatar position data for real-time movement
 */
export interface AvatarPosition {
    userId: string;
    x: number;
    y: number;
    direction: 'left' | 'right' | 'up' | 'down';
}

/**
 * Chat message structure
 */
export interface ChatMessage {
    id: string;
    userId: string;
    username: string;
    text: string;
    createdAt: string;
}

/**
 * Room data transfer object
 */
export interface RoomDTO {
    id: string;
    name: string;
    slug: string;
    isPrivate: boolean;
    layoutJson?: object | string;
    createdBy?: string;
}

/**
 * User data transfer object
 */
export interface UserDTO {
    id: string;
    username: string;
    email: string;
    role: 'user' | 'admin';
    avatarId?: string;
}

/**
 * Socket.io event types
 */
export interface SocketEvents {
    // Room events
    'room:join': (data: { roomId: string }) => void;
    'room:leave': (data: { roomId: string }) => void;

    // Avatar movement events
    'avatar:move': (data: AvatarPosition) => void;

    // Chat events
    'chat:message': (data: ChatMessage) => void;
}

/**
 * Link item for social/professional links
 */
export interface LinkItem {
    label: string;
    url: string;
}

/**
 * User profile with professional information
 */
export interface UserProfile {
    userId: string;
    headline: string;
    skills: string[];
    links: LinkItem[];
    bio?: string;
}

/**
 * Connection status type
 */
export type ConnectionStatus = 'pending' | 'accepted' | 'rejected';

/**
 * Connection between two users
 */
export interface Connection {
    id: string;
    fromUserId: string;
    toUserId: string;
    status: ConnectionStatus;
    createdAt?: string;
    updatedAt?: string;
}

/**
 * Response from connection list API
 */
export interface ConnectionListResponse {
    accepted: UserProfile[];
    incoming: Connection[];
    outgoing: Connection[];
}

/**
 * Request payload for updating profile
 */
export interface UpdateProfilePayload {
    headline?: string;
    skills?: string[];
    links?: LinkItem[];
    bio?: string;
}

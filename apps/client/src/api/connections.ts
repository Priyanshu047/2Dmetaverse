import http from './http';
import { Connection, ConnectionListResponse } from './types/networking';

/**
 * Send a connection request to another user
 * @param toUserId - The ID of the user to connect with
 * @returns Created connection data
 */
export const sendConnectionRequest = async (
    toUserId: string
): Promise<Connection> => {
    try {
        const response = await http.post('/connections/request', { toUserId });
        return response.data.data;
    } catch (error) {
        console.error('Error sending connection request:', error);
        throw error;
    }
};

/**
 * Respond to a connection request (accept or reject)
 * @param requestId - The ID of the connection request
 * @param action - 'accept' or 'reject'
 * @returns Updated connection data
 */
export const respondToConnection = async (
    requestId: string,
    action: 'accept' | 'reject'
): Promise<Connection> => {
    try {
        const response = await http.post('/connections/respond', {
            requestId,
            action,
        });
        return response.data.data;
    } catch (error) {
        console.error('Error responding to connection:', error);
        throw error;
    }
};

/**
 * Get list of all connections for current user
 * @returns Connection lists (accepted, incoming, outgoing)
 */
export const listConnections = async (): Promise<ConnectionListResponse> => {
    try {
        const response = await http.get('/connections/list');
        return response.data.data;
    } catch (error) {
        console.error('Error listing connections:', error);
        throw error;
    }
};

import { useState, useEffect, useCallback } from 'react';
import {
    listConnections,
    sendConnectionRequest,
    respondToConnection,
} from '../api/connections';
import {
    UserProfile,
    Connection,
    ConnectionListResponse,
} from '../api/types/networking';

/**
 * Connection status for a specific user
 */
export type UserConnectionStatus = 'none' | 'pending_sent' | 'pending_received' | 'accepted';

/**
 * Custom hook for managing user connections
 */
export const useConnections = () => {
    const [connections, setConnections] = useState<ConnectionListResponse>({
        accepted: [],
        incoming: [],
        outgoing: [],
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    /**
     * Fetch all connections for the current user
     */
    const fetchConnections = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await listConnections();
            setConnections(data);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch connections');
            console.error('Error fetching connections:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Send a connection request to a user
     */
    const sendRequest = useCallback(
        async (toUserId: string) => {
            try {
                await sendConnectionRequest(toUserId);
                // Refresh connections after sending
                await fetchConnections();
            } catch (err: any) {
                setError(err.message || 'Failed to send connection request');
                throw err;
            }
        },
        [fetchConnections]
    );

    /**
     * Respond to a connection request
     */
    const respondToRequest = useCallback(
        async (requestId: string, action: 'accept' | 'reject') => {
            try {
                await respondToConnection(requestId, action);
                // Refresh connections after responding
                await fetchConnections();
            } catch (err: any) {
                setError(err.message || 'Failed to respond to connection request');
                throw err;
            }
        },
        [fetchConnections]
    );

    /**
     * Get connection status with a specific user
     */
    const getConnectionStatus = useCallback(
        (userId: string): UserConnectionStatus => {
            // Check if accepted
            if (connections.accepted.some((c) => c.userId === userId)) {
                return 'accepted';
            }

            // Check if pending (sent by current user)
            if (connections.outgoing.some((c) => c.toUserId === userId)) {
                return 'pending_sent';
            }

            // Check if pending (received by current user)
            if (connections.incoming.some((c) => c.fromUserId === userId)) {
                return 'pending_received';
            }

            return 'none';
        },
        [connections]
    );

    /**
     * Get incoming request by user ID (if any)
     */
    const getIncomingRequest = useCallback(
        (userId: string): Connection | undefined => {
            return connections.incoming.find((c) => c.fromUserId === userId);
        },
        [connections]
    );

    // Fetch connections on mount
    useEffect(() => {
        fetchConnections();
    }, [fetchConnections]);

    return {
        // State
        connections,
        loading,
        error,

        // Methods
        refreshConnections: fetchConnections,
        sendRequest,
        respondToRequest,
        getConnectionStatus,
        getIncomingRequest,
    };
};

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3001';

export const useSocket = (roomId?: string, userId?: string, username?: string) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        // Create socket connection
        const newSocket = io(SOCKET_URL);
        socketRef.current = newSocket;
        setSocket(newSocket);

        // Connection events
        newSocket.on('connect', () => {
            console.log('Socket connected:', newSocket.id);
            setIsConnected(true);

            // Auto-join room if roomId is provided
            if (roomId) {
                newSocket.emit('room:join', { roomId, userId, username });
            }
        });

        newSocket.on('disconnect', () => {
            console.log('Socket disconnected');
            setIsConnected(false);
        });

        // Cleanup on unmount
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, []);

    // Update room when roomId changes
    useEffect(() => {
        if (socket && isConnected && roomId) {
            socket.emit('room:join', { roomId, userId, username });
        }
    }, [roomId, userId, username, socket, isConnected]);

    return {
        socket,
        isConnected,
    };
};

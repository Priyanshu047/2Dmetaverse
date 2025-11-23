import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import { config } from '../config/env';
import { AvatarPosition, ChatMessage } from '../types';
import { Room } from '../models/Room';
import { setupWebRTCHandlers } from './webrtc';
import { GameService } from '../services/gameService';
import { setupGameHandlers } from './gameHandlers';
import { setupStageHandlers } from './stageHandlers';
import { setSocketIO } from '../controllers/stageController';
import { setupModerationHandlers } from './moderationHandlers';
import { setSocketIOForAdmin } from '../controllers/adminController';

/**
 * Interface for socket data
 */
interface SocketData {
    userId?: string;
    username?: string;
    currentRoom?: string;
}

/**
 * Initialize Socket.io server
 */
export const initializeSocketServer = (httpServer: HTTPServer): Server => {
    // Create Socket.io server with CORS configuration
    const io = new Server(httpServer, {
        cors: {
            origin: config.clientUrl,
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });

    console.log('🔌 Socket.io server initialized');

    // Pass io instance to stage controller
    setSocketIO(io);

    // Pass io instance to admin controller
    setSocketIOForAdmin(io);

    // Initialize Game Service
    const gameService = new GameService(io);
    setupGameHandlers(io, gameService);

    // Initialize Stage handlers
    setupStageHandlers(io);

    // Initialize Moderation handlers
    setupModerationHandlers(io);

    // Handle socket connections
    io.on('connection', (socket: Socket) => {
        console.log(`✅ Client connected: ${socket.id}`);

        // Setup WebRTC signaling handlers
        setupWebRTCHandlers(socket, io);

        /**
         * Handle room join event
         */
        socket.on('room:join', async (data: { roomId: string; userId?: string; name?: string; avatarColor?: string }) => {
            const { roomId, userId, name, avatarColor } = data;

            // Leave previous room if any
            if ((socket.data as SocketData).currentRoom) {
                socket.leave((socket.data as SocketData).currentRoom!);
            }

            // Join the new room

            // CRITICAL FIX: Check if this user is already in the room (ghost user) and remove them
            if (userId) {
                const socketsInRoom = io.sockets.adapter.rooms.get(roomId);
                if (socketsInRoom) {
                    socketsInRoom.forEach((socketId) => {
                        const otherSocket = io.sockets.sockets.get(socketId);
                        if (otherSocket && socketId !== socket.id) {
                            const otherData = otherSocket.data as SocketData;
                            if (otherData.userId === userId) {
                                console.log(`⚠️ Found ghost user ${userId} (socket ${socketId}), forcing disconnect...`);
                                // Notify others that the old ghost user left
                                socket.to(roomId).emit('player:left', {
                                    playerId: userId
                                });
                                // Force the old socket to leave the room
                                otherSocket.leave(roomId);
                                otherData.currentRoom = undefined;
                                // Optionally disconnect the old socket
                                otherSocket.disconnect(true);
                            }
                        }
                    });
                }
            }

            socket.join(roomId);
            (socket.data as SocketData).currentRoom = roomId;
            (socket.data as SocketData).userId = userId;
            (socket.data as SocketData).username = name;

            // Check for admin role (Room Owner)
            let role = 'user';
            try {
                // Find room by slug OR roomId (6-digit)
                let room = await Room.findOne({ slug: roomId });
                if (!room) {
                    room = await Room.findOne({ roomId: roomId });
                }

                if (room && userId && room.ownerId === userId) {
                    role = 'admin';
                    console.log(`👑 Admin ${name} joined room ${roomId}`);
                }
            } catch (err) {
                console.error('Error checking room owner:', err);
            }

            // Set role in socket data
            (socket.data as any).role = role;

            console.log(`👤 User ${name || socket.id} joined room: ${roomId} as ${role}`);

            // Get all sockets in the room to send room state
            const socketsInRoom = io.sockets.adapter.rooms.get(roomId);
            const players: any[] = [];

            if (socketsInRoom) {
                socketsInRoom.forEach((socketId) => {
                    const playerSocket = io.sockets.sockets.get(socketId);
                    if (playerSocket && socketId !== socket.id) {
                        const playerData = playerSocket.data as SocketData;
                        players.push({
                            id: playerData.userId || socketId,
                            name: playerData.username || 'Anonymous',
                            avatarColor: '#888888', // Default color
                            x: 400,
                            y: 300,
                        });
                    }
                });
            }

            // Send current room state to the joining player
            socket.emit('room:state', { players });

            // Notify others in the room about new player
            socket.to(roomId).emit('player:joined', {
                id: userId || socket.id,
                name: name || 'Anonymous',
                avatarColor: avatarColor || '#3498db',
                x: 400,
                y: 300,
            });

            // Broadcast WebRTC peer-joined event to others in room
            socket.to(roomId).emit('webrtc:peer-joined', {
                peerId: socket.id,
            });

            // Send confirmation to the client
            socket.emit('room:joined', {
                roomId,
                message: `Successfully joined room: ${roomId}`,
                role // Send role back to client
            });

            // Explicitly emit role event
            socket.emit('room:role', { role });
        });

        /**
         * Handle room leave event
         */
        socket.on('room:leave', (data: { roomId: string }) => {
            const { roomId } = data;
            const socketData = socket.data as SocketData;

            socket.leave(roomId);

            console.log(`👋 User ${socketData.username || socket.id} left room: ${roomId}`);

            // Notify others in the room
            socket.to(roomId).emit('player:left', {
                playerId: socketData.userId || socket.id,
                socketId: socket.id, // Add socketId for WebRTC cleanup
            });

            socketData.currentRoom = undefined;
        });

        /**
         * Handle player movement event
         */
        socket.on('player:move', (data: { x: number; y: number }) => {
            const socketData = socket.data as SocketData;
            const currentRoom = socketData.currentRoom;

            if (!currentRoom) {
                socket.emit('error', { message: 'Not in a room' });
                return;
            }

            // Broadcast position to all other users in the room
            socket.to(currentRoom).emit('player:moved', {
                playerId: socketData.userId || socket.id,
                x: data.x,
                y: data.y,
            });
        });

        /**
         * Handle chat message event
         */
        socket.on('chat:message', (data: { text: string }) => {
            const socketData = socket.data as SocketData;
            const currentRoom = socketData.currentRoom;

            if (!currentRoom) {
                socket.emit('error', { message: 'Not in a room' });
                return;
            }

            const message: ChatMessage = {
                id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                userId: socketData.userId || socket.id,
                username: socketData.username || 'Anonymous',
                text: data.text,
                createdAt: new Date().toISOString(),
            };

            // Broadcast message to all users in the room (including sender)
            io.to(currentRoom).emit('chat:message', message);

            console.log(`💬 [${currentRoom}] ${message.username}: ${message.text}`);
        });

        /**
         * Handle disconnect event
         */
        socket.on('disconnect', () => {
            const socketData = socket.data as SocketData;

            console.log(`❌ Client disconnected: ${socket.id}`);

            // Notify room members if user was in a room
            if (socketData.currentRoom) {
                socket.to(socketData.currentRoom).emit('player:left', {
                    playerId: socketData.userId || socket.id,
                    socketId: socket.id, // Add socketId for WebRTC cleanup
                });
            }
        });

        /**
         * Handle errors
         */
        socket.on('error', (error) => {
            console.error(`❌ Socket error for ${socket.id}:`, error);
        });
    });

    return io;
};

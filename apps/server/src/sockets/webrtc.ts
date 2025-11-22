import { Server, Socket } from 'socket.io';

/**
 * Setup WebRTC signaling handlers
 * Relays WebRTC signaling messages between peers
 */
export const setupWebRTCHandlers = (socket: Socket, io: Server) => {
    /**
     * Handle WebRTC offer from initiator
     * Relay offer to the target peer
     */
    socket.on(
        'webrtc:offer',
        (data: { targetId: string; offer: any }) => {
            const { targetId, offer } = data;

            console.log(`📡 Relaying WebRTC offer from ${socket.id} to ${targetId}`);

            io.to(targetId).emit('webrtc:offer', {
                sourceId: socket.id,
                offer,
            });
        }
    );

    /**
     * Handle WebRTC answer from receiver
     * Relay answer back to the initiator
     */
    socket.on(
        'webrtc:answer',
        (data: { targetId: string; answer: any }) => {
            const { targetId, answer } = data;

            console.log(`📡 Relaying WebRTC answer from ${socket.id} to ${targetId}`);

            io.to(targetId).emit('webrtc:answer', {
                sourceId: socket.id,
                answer,
            });
        }
    );

    /**
     * Handle ICE candidate exchange
     * Relay ICE candidates between peers
     */
    socket.on(
        'webrtc:candidate',
        (data: { targetId: string; candidate: any }) => {
            const { targetId, candidate } = data;

            console.log(`📡 Relaying ICE candidate from ${socket.id} to ${targetId}`);

            io.to(targetId).emit('webrtc:candidate', {
                sourceId: socket.id,
                candidate,
            });
        }
    );
};

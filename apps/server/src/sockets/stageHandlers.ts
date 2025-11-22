import { Server, Socket } from 'socket.io';

/**
 * Setup stage-related Socket.io event handlers
 * Handles real-time events for virtual stage/conference room features
 */
export const setupStageHandlers = (io: Server) => {
    io.on('connection', (socket: Socket) => {
        /**
         * Handle microphone request from audience
         */
        socket.on(
            'stage:mic-request',
            (data: { roomId: string; userId: string; username: string }) => {
                const { roomId, userId, username } = data;

                console.log(`🎤 Mic request from ${username} in room: ${roomId}`);

                // Notify presenter (broadcast to room, presenter will filter on client)
                socket.to(roomId).emit('stage:mic-requested', {
                    userId,
                    username,
                    timestamp: new Date().toISOString(),
                });
            }
        );

        /**
         * Handle microphone approval from presenter
         */
        socket.on(
            'stage:mic-approve',
            (data: { roomId: string; userId: string; username: string }) => {
                const { roomId, userId, username } = data;

                console.log(`✅ Mic approved for ${username} in room: ${roomId}`);

                // Notify the specific user that their mic request was approved
                io.to(roomId).emit('stage:mic-approved', {
                    userId,
                    username,
                    timestamp: new Date().toISOString(),
                });
            }
        );

        /**
         * Handle microphone rejection from presenter
         */
        socket.on(
            'stage:mic-reject',
            (data: { roomId: string; userId: string; username: string }) => {
                const { roomId, userId, username } = data;

                console.log(`❌ Mic rejected for ${username} in room: ${roomId}`);

                // Notify the specific user
                io.to(roomId).emit('stage:mic-rejected', {
                    userId,
                    username,
                    timestamp: new Date().toISOString(),
                });
            }
        );

        /**
         * Handle question update (e.g., marking as answered)
         */
        socket.on(
            'stage:question-update',
            (data: { roomId: string; questionId: string; status: string }) => {
                const { roomId, questionId, status } = data;

                console.log(`📝 Question ${questionId} status updated to: ${status}`);

                // Broadcast question status update to all in room
                io.to(roomId).emit('stage:question-updated', {
                    questionId,
                    status,
                    timestamp: new Date().toISOString(),
                });
            }
        );
    });
};

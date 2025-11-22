import { Server, Socket } from 'socket.io';
import { GameService } from '../services/gameService';
import { GameJoinPayload, GameActionPayload } from '@metaverse/shared';

export const setupGameHandlers = (io: Server, gameService: GameService) => {
    io.on('connection', (socket: Socket) => {

        // Join a game
        socket.on('game:join', (payload: GameJoinPayload) => {
            try {
                const session = gameService.joinGame(socket, payload);

                // Emit joined event to the user
                socket.emit('game:joined', {
                    gameSessionId: session.sessionId,
                    players: session.players,
                    initialState: session
                });

                // Notify others in the game
                socket.to(`game:${session.sessionId}`).emit('game:update', {
                    type: 'player_joined',
                    player: session.players.find(p => p.socketId === socket.id)
                });

            } catch (error) {
                console.error('Error joining game:', error);
                socket.emit('game:error', { message: 'Failed to join game' });
            }
        });

        // Game Action
        socket.on('game:action', (payload: GameActionPayload) => {
            gameService.handleAction(socket, payload);
        });

        // Admin/Debug: Force next question
        socket.on('game:next', (payload: { gameSessionId: string }) => {
            gameService.nextQuestion(payload.gameSessionId);
        });

        // Leave game
        socket.on('game:leave', (payload: { gameSessionId: string }) => {
            gameService.leaveGame(socket, payload.gameSessionId);
        });
    });
};

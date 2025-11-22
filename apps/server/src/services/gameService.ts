import { Server, Socket } from 'socket.io';
import {
    GameSession,
    GamePlayer,
    GameZoneType,
    QuizQuestion,
    GameJoinPayload,
    GameActionPayload
} from '@metaverse/shared';
import { v4 as uuidv4 } from 'uuid';

// Sample Quiz Questions
const QUIZ_QUESTIONS: QuizQuestion[] = [
    {
        id: 'q1',
        question: 'What is the capital of France?',
        options: ['London', 'Berlin', 'Paris', 'Madrid'],
        correctIndex: 2
    },
    {
        id: 'q2',
        question: 'Which planet is known as the Red Planet?',
        options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
        correctIndex: 1
    },
    {
        id: 'q3',
        question: 'What is 2 + 2?',
        options: ['3', '4', '5', '22'],
        correctIndex: 1
    },
    {
        id: 'q4',
        question: 'Who wrote Romeo and Juliet?',
        options: ['Charles Dickens', 'William Shakespeare', 'Mark Twain', 'Jane Austen'],
        correctIndex: 1
    },
    {
        id: 'q5',
        question: 'What is the largest ocean on Earth?',
        options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'],
        correctIndex: 3
    }
];

export class GameService {
    private sessions: Map<string, GameSession> = new Map();
    private io: Server;

    constructor(io: Server) {
        this.io = io;
    }

    /**
     * Create or join a game session
     */
    public joinGame(socket: Socket, payload: GameJoinPayload): GameSession {
        const { roomId, zoneId, gameId, userId, username } = payload;

        // Generate a unique session ID based on room and zone (one active game per zone)
        // Or we could allow multiple instances. For now, let's map roomId+zoneId to a session.
        const sessionKey = `${roomId}:${zoneId}`;

        let session = this.sessions.get(sessionKey);

        if (!session) {
            // Create new session
            session = {
                sessionId: uuidv4(),
                roomId,
                zoneId,
                gameId,
                type: 'quiz', // Defaulting to quiz for now, logic can be expanded
                players: [],
                state: 'waiting',
                questions: [...QUIZ_QUESTIONS], // Copy questions
                currentQuestionIndex: 0,
                startTime: Date.now()
            };
            this.sessions.set(sessionKey, session);
            console.log(`🎮 Created new game session: ${session.sessionId} for zone ${zoneId}`);
        }

        // Check if player is already in
        const existingPlayer = session.players.find(p => p.userId === userId);
        if (!existingPlayer) {
            const newPlayer: GamePlayer = {
                userId,
                socketId: socket.id,
                name: username,
                score: 0
            };
            session.players.push(newPlayer);
        } else {
            // Update socket ID in case of reconnect
            existingPlayer.socketId = socket.id;
        }

        // Join socket room
        socket.join(`game:${session.sessionId}`);

        return session;
    }

    /**
     * Handle player leaving a game
     */
    public leaveGame(socket: Socket, sessionId: string) {
        // Find session by ID (since we store by key, we iterate or need a secondary map)
        // For simplicity, we'll search values
        let targetSession: GameSession | undefined;
        let targetKey: string | undefined;

        for (const [key, session] of this.sessions.entries()) {
            if (session.sessionId === sessionId) {
                targetSession = session;
                targetKey = key;
                break;
            }
        }

        if (targetSession) {
            targetSession.players = targetSession.players.filter(p => p.socketId !== socket.id);
            socket.leave(`game:${sessionId}`);

            this.io.to(`game:${sessionId}`).emit('game:update', {
                type: 'player_left',
                players: targetSession.players
            });

            // If empty, clean up
            if (targetSession.players.length === 0) {
                this.sessions.delete(targetKey!);
                console.log(`🗑️ Game session ${sessionId} ended (empty)`);
            }
        }
    }

    /**
     * Process game actions
     */
    public handleAction(socket: Socket, payload: GameActionPayload) {
        const { gameSessionId, actionType, payload: actionData } = payload;

        // Find session
        let session: GameSession | undefined;
        for (const s of this.sessions.values()) {
            if (s.sessionId === gameSessionId) {
                session = s;
                break;
            }
        }

        if (!session) return;

        const player = session.players.find(p => p.socketId === socket.id);
        if (!player) return;

        switch (actionType) {
            case 'submit_answer':
                this.handleQuizAnswer(session, player, actionData);
                break;
            case 'start_game':
                this.startGame(session);
                break;
        }
    }

    private handleQuizAnswer(session: GameSession, player: GamePlayer, data: { answerIndex: number }) {
        if (session.state !== 'in-progress' || session.questions === undefined || session.currentQuestionIndex === undefined) return;

        const currentQuestion = session.questions[session.currentQuestionIndex];

        // Check if correct
        if (data.answerIndex === currentQuestion.correctIndex) {
            player.score += 10;

            // Notify everyone of score update
            this.io.to(`game:${session.sessionId}`).emit('game:update', {
                type: 'score_update',
                players: session.players,
                lastAnswer: {
                    playerId: player.userId,
                    correct: true
                }
            });
        } else {
            this.io.to(`game:${session.sessionId}`).emit('game:update', {
                type: 'score_update',
                players: session.players,
                lastAnswer: {
                    playerId: player.userId,
                    correct: false
                }
            });
        }

        // Logic to move to next question could be here, or triggered by a timer.
        // For simplicity, let's say everyone answers individually, but we want to sync questions.
        // Let's implement a simple "First to answer correctly moves game forward" or just "Wait for all"?
        // Better: Timer based or Host based. 
        // Simplest for this demo: Check if all players answered? 
        // actually, let's just keep it simple:
        // If ANYONE answers correctly, we move to next question after a short delay?
        // Or better: Each player answers, we wait 3 seconds then next question.

        // Let's do: If all players have answered (we need to track who answered current Q), move next.
        // For this demo, let's just rely on a "next_question" event from client or auto-advance.

        // Let's auto-advance if everyone answered.
        // We need to track who answered the current question.
        // Adding `answeredPlayers` to session would be needed.
        // For now, let's just emit the answer result.
    }

    private startGame(session: GameSession) {
        if (session.state === 'in-progress') return;

        session.state = 'in-progress';
        session.currentQuestionIndex = 0;

        this.io.to(`game:${session.sessionId}`).emit('game:state', session);
    }

    public nextQuestion(sessionId: string) {
        let session: GameSession | undefined;
        for (const s of this.sessions.values()) {
            if (s.sessionId === sessionId) {
                session = s;
                break;
            }
        }
        if (!session || !session.questions) return;

        if (session.currentQuestionIndex! < session.questions.length - 1) {
            session.currentQuestionIndex!++;
            this.io.to(`game:${sessionId}`).emit('game:update', {
                type: 'next_question',
                currentQuestionIndex: session.currentQuestionIndex
            });
        } else {
            this.endGame(session);
        }
    }

    private endGame(session: GameSession) {
        session.state = 'finished';
        this.io.to(`game:${session.sessionId}`).emit('game:ended', {
            finalScores: session.players
        });

        // Clean up session after delay
        setTimeout(() => {
            // Find key and delete
            for (const [key, s] of this.sessions.entries()) {
                if (s === session) {
                    this.sessions.delete(key);
                    break;
                }
            }
        }, 60000); // 1 minute to view scores
    }
}

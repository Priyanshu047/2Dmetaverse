import express, { Application } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { config, validateEnv } from './config/env';
import { connectDatabase } from './config/db';
import { errorHandler, notFound } from './middleware/errorMiddleware';
import { initializeSocketServer } from './sockets';
import authRoutes from './routes/authRoutes';
import roomRoutes from './routes/roomRoutes';
import npcRoutes from './routes/npcRoutes';
import profileRoutes from './routes/profileRoutes';
import connectionRoutes from './routes/connectionRoutes';
import stageRoutes from './routes/stageRoutes';
import adminRoutes from './routes/adminRoutes';
import { Room } from './models/Room';
import { NpcConfig } from './models/NpcConfig';

const seedRooms = async () => {
    try {
        const count = await Room.countDocuments();
        if (count === 0) {
            console.log('🌱 Seeding default rooms...');
            const rooms = [
                {
                    name: 'Main Lobby',
                    slug: 'lobby',
                    type: 'LOBBY',
                    description: 'The main entry point for all users.',
                    layout: {
                        layoutJson: {
                            width: 20,
                            height: 20,
                            layers: []
                        },
                        spawnPoints: [{ name: 'default', x: 400, y: 300 }]
                    }
                },
                {
                    name: 'Networking Lounge',
                    slug: 'networking-lounge',
                    type: 'NETWORKING_LOUNGE',
                    description: 'A quiet place to chat with others.',
                    layout: {
                        layoutJson: {
                            width: 20,
                            height: 20,
                            layers: []
                        },
                        spawnPoints: [{ name: 'default', x: 400, y: 300 }]
                    }
                },
                {
                    name: 'Main Stage',
                    slug: 'stage',
                    type: 'STAGE',
                    description: 'Where the magic happens.',
                    layout: {
                        layoutJson: {
                            width: 30,
                            height: 20,
                            layers: []
                        },
                        spawnPoints: [{ name: 'default', x: 100, y: 300 }]
                    }
                },
                {
                    name: 'Game Room',
                    slug: 'game-room',
                    type: 'GAME_ROOM',
                    description: 'Play games with friends.',
                    layout: {
                        layoutJson: {
                            width: 20,
                            height: 20,
                            layers: []
                        },
                        spawnPoints: [{ name: 'default', x: 400, y: 300 }],
                        gameZones: [
                            {
                                id: 'quiz_zone_1',
                                type: 'quiz',
                                gameId: 'quiz-1',
                                x: 200,
                                y: 200,
                                width: 150,
                                height: 150
                            }
                        ]
                    }
                }
            ];

            await Room.insertMany(rooms);
            console.log('✅ Default rooms seeded successfully');
        }
    } catch (error) {
        console.error('❌ Error seeding rooms:', error);
    }
};

const seedNpcs = async () => {
    try {
        const count = await NpcConfig.countDocuments();
        if (count === 0) {
            console.log('🤖 Seeding default NPCs...');
            const npcs = [
                {
                    roomSlug: 'lobby',
                    name: 'GuideBot',
                    displayName: 'Lobby Guide',
                    role: 'GUIDE',
                    systemPrompt: `You are a friendly and helpful lobby guide in a virtual metaverse. Your role is to:
- Welcome new users warmly
- Help users navigate to different rooms
- Explain basic features of the metaverse
- Answer questions about where to find specific areas
- Be encouraging and supportive

Keep your responses brief, friendly, and action-oriented.`,
                    triggerZones: [
                        { id: 'lobby_guide_zone', x: 350, y: 250, width: 100, height: 100 }
                    ],
                    maxMessagesPerMinute: 5,
                    active: true
                },
                {
                    roomSlug: 'networking-lounge',
                    name: 'HostBot',
                    displayName: 'Lounge Host',
                    role: 'HOST',
                    systemPrompt: `You are a charismatic and welcoming host in the networking lounge. Your role is to:
- Encourage meaningful conversations
- Suggest networking tips and ice-breakers
- Share information about virtual events
- Help users feel comfortable socializing
- Promote a friendly, inclusive atmosphere

Be warm, enthusiastic, and conversational.`,
                    triggerZones: [
                        { id: 'lounge_host_zone', x: 300, y: 200, width: 120, height: 120 }
                    ],
                    maxMessagesPerMinute: 5,
                    active: true
                },
                {
                    roomSlug: 'stage',
                    name: 'ModeratorBot',
                    displayName: 'Stage Moderator',
                    role: 'MODERATOR',
                    systemPrompt: `You are a professional stage moderator. Your role is to:
- Assist with presentation setup and technical issues
- Enforce stage etiquette and rules
- Help speakers and audience members
- Provide information about scheduled events
- Maintain order and professionalism

Be polite, professional, and efficient.`,
                    triggerZones: [
                        { id: 'stage_mod_zone', x: 400, y: 150, width: 100, height: 100 }
                    ],
                    maxMessagesPerMinute: 5,
                    active: true
                },
                {
                    roomSlug: 'game-room',
                    name: 'GameMaster',
                    displayName: 'Game Master',
                    role: 'ASSISTANT',
                    systemPrompt: `You are an energetic game master. Your role is to:
- Explain game rules and mechanics
- Help users join games and activities
- Share tips and strategies
- Keep the energy high and fun
- Encourage friendly competition

Be playful, enthusiastic, and helpful.`,
                    triggerZones: [
                        { id: 'game_master_zone', x: 380, y: 280, width: 100, height: 100 }
                    ],
                    maxMessagesPerMinute: 5,
                    active: true
                }
            ];

            await NpcConfig.insertMany(npcs);
            console.log('✅ Default NPCs seeded successfully');
        }
    } catch (error) {
        console.error('❌ Error seeding NPCs:', error);
    }
};

/**
 * Initialize Express application
 */
const app: Application = express();

/**
 * Create HTTP server (required for Socket.io)
 */
const httpServer = createServer(app);

/**
 * Middleware configuration
 */

// CORS configuration
app.use(
    cors({
        origin: config.clientUrl,
        credentials: true,
    })
);

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging in development
if (config.nodeEnv === 'development') {
    app.use((req, res, next) => {
        console.log(`${req.method} ${req.path}`);
        next();
    });
}

/**
 * API Routes
 */

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
    });
});

// API v1 routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/npc', npcRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/stage', stageRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler (must be after all routes)
app.use(notFound);

// Global error handler (must be last)
app.use(errorHandler);

/**
 * Initialize Socket.io
 */
const io = initializeSocketServer(httpServer);

/**
 * Start server
 */
const startServer = async (): Promise<void> => {
    try {
        // Validate environment variables
        validateEnv();

        // Connect to MongoDB
        await connectDatabase();

        // Seed default rooms
        await seedRooms();

        // Seed default NPCs
        await seedNpcs();

        // Start listening
        httpServer.listen(config.port, () => {
            console.log('');
            console.log('🚀 Server started successfully!');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log(`📡 HTTP Server:    http://localhost:${config.port}`);
            console.log(`🔌 Socket.io:      ws://localhost:${config.port}`);
            console.log(`🌍 Environment:    ${config.nodeEnv}`);
            console.log(`🔗 Client URL:     ${config.clientUrl}`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('');
            console.log('📚 API Endpoints:');
            console.log('   GET  /health');
            console.log('');
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// Start the server
startServer();

// Export for testing
export { app, httpServer, io };

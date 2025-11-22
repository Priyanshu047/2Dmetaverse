import mongoose from 'mongoose';
import { Room } from './models/Room';
import { config } from './config/env';
import { connectDatabase } from './config/db';

const updateGameRoom = async () => {
    await connectDatabase();

    const gameRoom = await Room.findOne({ slug: 'game-room' });
    if (gameRoom) {
        console.log('Found Game Room, updating layout...');
        if (!gameRoom.layout) {
            gameRoom.layout = {
                layoutJson: { width: 20, height: 20, layers: [] },
                spawnPoints: [{ name: 'default', x: 400, y: 300 }],
                gameZones: []
            };
        }

        gameRoom.layout.gameZones = [
            {
                id: 'quiz_zone_1',
                type: 'quiz',
                gameId: 'quiz-1',
                x: 200,
                y: 200,
                width: 150,
                height: 150
            }
        ];

        // Mongoose might not detect deep change in mixed/subdoc unless marked
        gameRoom.markModified('layout');
        await gameRoom.save();
        console.log('✅ Game Room updated with game zones!');
    } else {
        console.log('❌ Game Room not found!');
    }

    process.exit(0);
};

updateGameRoom().catch(console.error);

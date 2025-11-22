import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { gameConfig } from './game/config';
import { RoomScene } from './game/scenes/RoomScene';

import { RoomLayout } from '@metaverse/shared';

interface PhaserRoomCanvasProps {
    roomId: string;
    user: {
        id: string;
        name: string;
        avatarColor: string;
    };
    roomLayout?: RoomLayout;
    onAvatarClick?: (userId: string) => void;
}

/**
 * React component wrapper for Phaser game
 * Manages Phaser.Game lifecycle and passes room/user data to scene
 */
const PhaserRoomCanvas: React.FC<PhaserRoomCanvasProps> = ({ roomId, user, roomLayout, onAvatarClick }) => {
    const gameRef = useRef<Phaser.Game | null>(null);

    useEffect(() => {
        // Create game instance
        gameRef.current = new Phaser.Game(gameConfig);

        // Wait for RoomScene to be ready and pass init data
        const checkScene = setInterval(() => {
            const scene = gameRef.current?.scene.getScene('RoomScene') as RoomScene;
            if (scene && scene.scene.isActive('RoomScene')) {
                // Scene takes care of initialization via init() method
                clearInterval(checkScene);
            }
        }, 100);

        // Start RoomScene with init data
        setTimeout(() => {
            const scene = gameRef.current?.scene.getScene('RoomScene') as RoomScene;
            if (scene) {
                scene.scene.restart({
                    roomId,
                    userId: user.id,
                    name: user.name,
                    avatarColor: user.avatarColor,
                    roomLayout,
                    onAvatarClick
                });
            }
        }, 200);

        // Cleanup on unmount
        return () => {
            clearInterval(checkScene);
            if (gameRef.current) {
                // Destroy game instance
                gameRef.current.destroy(true);
                gameRef.current = null;
            }
        };
    }, [roomId, user.id, user.name, user.avatarColor, onAvatarClick]);

    return (
        <div
            id="phaser-container"
            className="border-2 border-gray-700 rounded-lg overflow-hidden"
        />
    );
};

export default PhaserRoomCanvas;

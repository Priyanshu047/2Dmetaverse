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
    const initializedRef = useRef(false);

    useEffect(() => {
        // Only initialize once
        if (initializedRef.current) return;
        initializedRef.current = true;

        console.log('🎮 Initializing Phaser game...');

        // Create game instance
        gameRef.current = new Phaser.Game(gameConfig);

        // Wait for RoomScene to be ready and pass init data
        const checkScene = setInterval(() => {
            const scene = gameRef.current?.scene.getScene('RoomScene') as RoomScene;
            if (scene && scene.scene.isActive('RoomScene')) {
                clearInterval(checkScene);
            }
        }, 100);

        // Start RoomScene with init data
        setTimeout(() => {
            const scene = gameRef.current?.scene.getScene('RoomScene') as RoomScene;
            if (scene) {
                console.log('🚀 Starting RoomScene with data:', { roomId, userId: user.id });
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

        // Cleanup on unmount ONLY
        return () => {
            console.log('🧹 Unmounting PhaserRoomCanvas - destroying game...');
            clearInterval(checkScene);
            if (gameRef.current) {
                // Destroy game instance
                gameRef.current.destroy(true);
                gameRef.current = null;
            }
            initializedRef.current = false;
        };
    }, []); // Empty dependency array - only run once on mount

    return (
        <div
            id="phaser-container"
            className="border-2 border-gray-700 rounded-lg overflow-hidden"
        />
    );
};

export default PhaserRoomCanvas;

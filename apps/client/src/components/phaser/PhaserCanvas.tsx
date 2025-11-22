import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { gameConfig } from './game/config';
import { MainScene } from './game/scenes/MainScene';
import type { AvatarPosition } from '@metaverse/shared';

interface PhaserCanvasProps {
    userId: string;
    username: string;
    onMove: (position: AvatarPosition) => void;
}

const PhaserCanvas: React.FC<PhaserCanvasProps> = ({
    userId,
    username,
    onMove,
}) => {
    const gameRef = useRef<Phaser.Game | null>(null);
    const sceneRef = useRef<MainScene | null>(null);

    useEffect(() => {
        // Create game instance
        gameRef.current = new Phaser.Game(gameConfig);

        // Wait for scene to be ready
        const checkScene = setInterval(() => {
            const scene = gameRef.current?.scene.getScene('MainScene') as MainScene;
            if (scene && scene.scene.isActive('MainScene')) {
                sceneRef.current = scene;
                scene.setUserData(userId, username);
                scene.setMoveCallback(onMove);
                clearInterval(checkScene);
            }
        }, 100);

        // Cleanup on unmount
        return () => {
            clearInterval(checkScene);
            if (gameRef.current) {
                gameRef.current.destroy(true);
                gameRef.current = null;
            }
        };
    }, [userId, username, onMove]);

    return (
        <div
            id="phaser-container"
            className="border-2 border-gray-700 rounded-lg overflow-hidden"
        />
    );
};

export default PhaserCanvas;

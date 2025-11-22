import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { GameScene } from '../game/GameScene';
import type { AvatarPosition } from '@metaverse/shared';

interface GameCanvasProps {
    userId: string;
    username: string;
    onMove: (position: AvatarPosition) => void;
    onOtherPlayerMove?: (userId: string, username: string, x: number, y: number) => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({
    userId,
    username,
    onMove,
}) => {
    const gameRef = useRef<Phaser.Game | null>(null);
    const sceneRef = useRef<GameScene | null>(null);

    useEffect(() => {
        // Create game scene
        const scene = new GameScene(userId, username);
        sceneRef.current = scene;

        // Game configuration
        const config: Phaser.Types.Core.GameConfig = {
            type: Phaser.AUTO,
            width: 800,
            height: 600,
            parent: 'game-container',
            backgroundColor: '#2c3e50',
            scene: scene,
        };

        // Create game instance
        gameRef.current = new Phaser.Game(config);

        // Set move callback
        scene.setMoveCallback(onMove);

        // Cleanup on unmount
        return () => {
            if (gameRef.current) {
                gameRef.current.destroy(true);
            }
        };
    }, [userId, username, onMove]);

    return <div id="game-container" className="border-2 border-gray-700 rounded-lg" />;
};

export default GameCanvas;

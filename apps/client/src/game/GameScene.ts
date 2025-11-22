import Phaser from 'phaser';
import type { AvatarPosition } from '@metaverse/shared';

export class GameScene extends Phaser.Scene {
    private player!: Phaser.GameObjects.Rectangle;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private otherPlayers: Map<string, Phaser.GameObjects.Rectangle> = new Map();
    private playerSpeed = 200;
    private onMove?: (position: AvatarPosition) => void;
    private userId: string;
    private username: string;

    constructor(userId: string, username: string) {
        super({ key: 'GameScene' });
        this.userId = userId;
        this.username = username;
    }

    create() {
        // Create simple room background
        this.add.rectangle(400, 300, 800, 600, 0x2c3e50);

        // Add some walls
        this.add.rectangle(400, 10, 800, 20, 0x34495e); // Top wall
        this.add.rectangle(400, 590, 800, 20, 0x34495e); // Bottom wall
        this.add.rectangle(10, 300, 20, 600, 0x34495e); // Left wall
        this.add.rectangle(790, 300, 20, 600, 0x34495e); // Right wall

        // Create player avatar
        this.player = this.add.rectangle(400, 300, 30, 30, 0x3498db);

        // Add player name
        this.add.text(this.player.x, this.player.y - 25, this.username, {
            fontSize: '12px',
            color: '#ffffff',
        }).setOrigin(0.5);

        // Enable keyboard input
        this.cursors = this.input.keyboard!.createCursorKeys();
    }

    update() {
        if (!this.player || !this.cursors) return;

        let moved = false;
        let direction: 'left' | 'right' | 'up' | 'down' = 'down';

        if (this.cursors.left.isDown) {
            this.player.x -= this.playerSpeed * (1 / 60);
            direction = 'left';
            moved = true;
        } else if (this.cursors.right.isDown) {
            this.player.x += this.playerSpeed * (1 / 60);
            direction = 'right';
            moved = true;
        }

        if (this.cursors.up.isDown) {
            this.player.y -= this.playerSpeed * (1 / 60);
            direction = 'up';
            moved = true;
        } else if (this.cursors.down.isDown) {
            this.player.y += this.playerSpeed * (1 / 60);
            direction = 'down';
            moved = true;
        }

        // Constrain player to room bounds
        this.player.x = Phaser.Math.Clamp(this.player.x, 30, 770);
        this.player.y = Phaser.Math.Clamp(this.player.y, 30, 570);

        // Emit movement event
        if (moved && this.onMove) {
            this.onMove({
                userId: this.userId,
                x: this.player.x,
                y: this.player.y,
                direction,
            });
        }
    }

    setMoveCallback(callback: (position: AvatarPosition) => void) {
        this.onMove = callback;
    }

    updateOtherPlayer(userId: string, username: string, x: number, y: number) {
        let avatar = this.otherPlayers.get(userId);

        if (!avatar) {
            // Create new avatar for other player
            avatar = this.add.rectangle(x, y, 30, 30, 0xe74c3c);
            this.add.text(x, y - 25, username, {
                fontSize: '12px',
                color: '#ffffff',
            }).setOrigin(0.5);
            this.otherPlayers.set(userId, avatar);
        } else {
            // Update position
            avatar.setPosition(x, y);
        }
    }

    removeOtherPlayer(userId: string) {
        const avatar = this.otherPlayers.get(userId);
        if (avatar) {
            avatar.destroy();
            this.otherPlayers.delete(userId);
        }
    }
}

import Phaser from 'phaser';
import type { AvatarPosition } from '@metaverse/shared';

export class MainScene extends Phaser.Scene {
    private player!: Phaser.GameObjects.Rectangle;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private otherPlayers: Map<string, { avatar: Phaser.GameObjects.Rectangle; label: Phaser.GameObjects.Text }> = new Map();
    private playerSpeed = 200;
    private onMove?: (position: AvatarPosition) => void;
    private userId: string = '';
    private username: string = '';
    private playerLabel!: Phaser.GameObjects.Text;

    constructor() {
        super({ key: 'MainScene' });
    }

    init(data: { userId: string; username: string }) {
        // Initialize with data passed from PhaserCanvas
        this.userId = data.userId;
        this.username = data.username;
    }

    create() {
        // Create simple room background
        this.add.rectangle(400, 300, 800, 600, 0x2c3e50);

        // Add some walls for visual clarity
        this.add.rectangle(400, 10, 800, 20, 0x34495e); // Top wall
        this.add.rectangle(400, 590, 800, 20, 0x34495e); // Bottom wall
        this.add.rectangle(10, 300, 20, 600, 0x34495e); // Left wall
        this.add.rectangle(790, 300, 20, 600, 0x34495e); // Right wall

        // Create player avatar
        this.player = this.add.rectangle(400, 300, 30, 30, 0x3498db);

        // Add player name above avatar
        this.playerLabel = this.add.text(this.player.x, this.player.y - 25, this.username, {
            fontSize: '12px',
            color: '#ffffff',
        });
        this.playerLabel.setOrigin(0.5);

        // Add instruction text
        const instructionText = this.add.text(400, 30, 'Use Arrow Keys to Move', {
            fontSize: '16px',
            color: '#ffffff',
            backgroundColor: '#000000aa',
            padding: { x: 10, y: 5 },
        });
        instructionText.setOrigin(0.5);

        // Enable keyboard input
        this.cursors = this.input.keyboard!.createCursorKeys();
    }

    update() {
        if (!this.player || !this.cursors) return;

        let moved = false;
        let direction: 'left' | 'right' | 'up' | 'down' = 'down';

        // Handle player movement
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

        // Update player label position
        if (this.playerLabel) {
            this.playerLabel.setPosition(this.player.x, this.player.y - 25);
        }

        // Emit movement event to server if player moved
        if (moved && this.onMove) {
            this.onMove({
                userId: this.userId,
                x: this.player.x,
                y: this.player.y,
                direction,
            });
        }
    }

    /**
     * Set callback for player movement
     */
    setMoveCallback(callback: (position: AvatarPosition) => void) {
        this.onMove = callback;
    }

    /**
     * Update or create another player's avatar
     */
    updateOtherPlayer(userId: string, username: string, x: number, y: number) {
        let playerData = this.otherPlayers.get(userId);

        if (!playerData) {
            // Create new avatar for other player
            const avatar = this.add.rectangle(x, y, 30, 30, 0xe74c3c);
            const label = this.add.text(x, y - 25, username, {
                fontSize: '12px',
                color: '#ffffff',
            });
            label.setOrigin(0.5);

            playerData = { avatar, label };
            this.otherPlayers.set(userId, playerData);
        } else {
            // Update position
            playerData.avatar.setPosition(x, y);
            playerData.label.setPosition(x, y - 25);
        }
    }

    /**
     * Remove another player's avatar
     */
    removeOtherPlayer(userId: string) {
        const playerData = this.otherPlayers.get(userId);
        if (playerData) {
            playerData.avatar.destroy();
            playerData.label.destroy();
            this.otherPlayers.delete(userId);
        }
    }

    /**
     * Set user data (called from PhaserCanvas)
     */
    setUserData(userId: string, username: string) {
        this.userId = userId;
        this.username = username;
        if (this.playerLabel) {
            this.playerLabel.setText(username);
        }
    }
}

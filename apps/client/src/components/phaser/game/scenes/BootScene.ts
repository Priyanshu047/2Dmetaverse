import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // Display loading text
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;

        const loadingText = this.add.text(centerX, centerY, 'Loading...', {
            fontSize: '24px',
            color: '#ffffff',
        });
        loadingText.setOrigin(0.5);

        // Preload any assets needed for the game
        // For now, we'll just transition to MainScene
        // In future, load sprites, images, audio, etc. here
        // Example:
        // this.load.image('player', '/assets/player.png');
        // this.load.image('background', '/assets/background.png');
    }

    create() {
        // Once loading is complete, transition to MainScene
        this.scene.start('MainScene');
    }
}

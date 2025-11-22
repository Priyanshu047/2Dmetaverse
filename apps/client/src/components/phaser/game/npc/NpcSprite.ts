import Phaser from 'phaser';
import type { NpcConfig } from '@metaverse/shared';

/**
 * Custom NPC Sprite with name label and interaction indicator
 */
export class NpcSprite extends Phaser.GameObjects.Container {
    private npcConfig: NpcConfig;
    private sprite: Phaser.GameObjects.Sprite;
    private nameLabel: Phaser.GameObjects.Text;
    private interactionPrompt: Phaser.GameObjects.Image | null = null;
    private showingPrompt: boolean = false;

    constructor(scene: Phaser.Scene, npcConfig: NpcConfig, spriteKey: string) {
        super(scene, 0, 0);

        this.npcConfig = npcConfig;

        // Determine position from first trigger zone
        const firstZone = npcConfig.triggerZones[0];
        if (firstZone) {
            this.x = firstZone.x + firstZone.width / 2;
            this.y = firstZone.y + firstZone.height / 2;
        }

        // Create main sprite
        this.sprite = scene.add.sprite(0, 0, spriteKey);
        this.sprite.setScale(1);
        this.add(this.sprite);

        // Create name label above sprite
        this.nameLabel = scene.add.text(0, -40, npcConfig.displayName, {
            fontSize: '12px',
            color: '#ffffff',
            backgroundColor: '#000000aa',
            padding: { x: 4, y: 2 },
        });
        this.nameLabel.setOrigin(0.5, 0.5);
        this.add(this.nameLabel);

        // Add to scene
        scene.add.existing(this);

        // Enable simple idle animation (bounce)
        this.startIdleAnimation();
    }

    /**
     * Start simple idle animation
     */
    private startIdleAnimation() {
        this.scene.tweens.add({
            targets: this.sprite,
            y: -5,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    /**
     * Show interaction prompt (E key icon)
     */
    showInteractionPrompt() {
        if (this.showingPrompt) return;

        this.showingPrompt = true;

        // Create E key prompt if not exists
        if (!this.interactionPrompt) {
            this.interactionPrompt = this.scene.add.image(0, -60, 'e_key');
            this.interactionPrompt.setScale(0.5);
            this.add(this.interactionPrompt);
        }

        this.interactionPrompt.setVisible(true);

        // Pulse animation
        this.scene.tweens.add({
            targets: this.interactionPrompt,
            scale: 0.6,
            duration: 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    /**
     * Hide interaction prompt
     */
    hideInteractionPrompt() {
        if (!this.showingPrompt) return;

        this.showingPrompt = false;

        if (this.interactionPrompt) {
            this.interactionPrompt.setVisible(false);
            this.scene.tweens.killTweensOf(this.interactionPrompt);
        }
    }

    /**
     * Get NPC configuration
     */
    getConfig(): NpcConfig {
        return this.npcConfig;
    }

    /**
     * Cleanup
     */
    destroy(fromScene?: boolean) {
        this.scene.tweens.killTweensOf(this.sprite);
        if (this.interactionPrompt) {
            this.scene.tweens.killTweensOf(this.interactionPrompt);
        }
        super.destroy(fromScene);
    }
}

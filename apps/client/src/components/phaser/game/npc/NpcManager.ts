import Phaser from 'phaser';
import type { NpcConfig } from '@metaverse/shared';
import { NpcSprite } from './NpcSprite';

export interface NpcInteractionEvent {
    npcName: string;
    npcDisplayName: string;
    npcConfig: NpcConfig;
}

/**
 * Manages all NPCs in a room
 */
export class NpcManager {
    private scene: Phaser.Scene;
    private npcs: Map<string, NpcSprite> = new Map();
    private triggerZones: Map<string, Phaser.GameObjects.Zone> = new Map();
    private currentOverlapNpc: string | null = null;
    private onInteractionRequested?: (event: NpcInteractionEvent) => void;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    /**
     * Load NPC assets
     */
    preloadAssets() {
        // NPC sprites
        this.scene.load.image('npc_guide', '/assets/npcs/guide_bot.png');
        this.scene.load.image('npc_host', '/assets/npcs/host_bot.png');
        this.scene.load.image('npc_moderator', '/assets/npcs/moderator_bot.png');
        this.scene.load.image('npc_gamemaster', '/assets/npcs/gamemaster.png');

        // E key prompt
        this.scene.load.image('e_key', '/assets/e_key.png');
    }

    /**
     * Initialize NPCs for the current room
     */
    initializeNpcs(npcConfigs: NpcConfig[], playerSprite?: Phaser.GameObjects.Sprite) {
        // Clear existing NPCs
        this.cleanup();

        npcConfigs.forEach(config => {
            // Determine sprite key based on NPC name
            let spriteKey = 'npc_guide';
            if (config.name.toLowerCase().includes('host')) {
                spriteKey = 'npc_host';
            } else if (config.name.toLowerCase().includes('moderator')) {
                spriteKey = 'npc_moderator';
            } else if (config.name.toLowerCase().includes('game')) {
                spriteKey = 'npc_gamemaster';
            }

            // Create NPC sprite
            const npcSprite = new NpcSprite(this.scene, config, spriteKey);
            this.npcs.set(config.name, npcSprite);

            // Create trigger zones
            config.triggerZones.forEach(zone => {
                const triggerZone = this.scene.add.zone(
                    zone.x + zone.width / 2,
                    zone.y + zone.height / 2,
                    zone.width,
                    zone.height
                );

                // Enable physics if available
                if (this.scene.physics && this.scene.physics.world) {
                    this.scene.physics.world.enable(triggerZone);
                }

                this.triggerZones.set(`${config.name}_${zone.id}`, triggerZone);

                // Setup overlap detection if player sprite provided
                if (playerSprite && this.scene.physics && this.scene.physics.world) {
                    this.scene.physics.add.overlap(
                        playerSprite,
                        triggerZone,
                        () => this.handlePlayerEnterZone(config.name),
                        undefined,
                        this
                    );
                }
            });
        });

        console.log(`Initialized ${npcConfigs.length} NPCs with ${this.triggerZones.size} trigger zones`);
    }

    /**
     * Handle player entering NPC trigger zone
     */
    private handlePlayerEnterZone(npcName: string) {
        if (this.currentOverlapNpc === npcName) return;

        this.currentOverlapNpc = npcName;

        const npc = this.npcs.get(npcName);
        if (npc) {
            npc.showInteractionPrompt();
        }
    }

    /**
     * Handle player leaving NPC trigger zone
     */
    private handlePlayerLeaveZone(npcName: string) {
        if (this.currentOverlapNpc !== npcName) return;

        this.currentOverlapNpc = null;

        const npc = this.npcs.get(npcName);
        if (npc) {
            npc.hideInteractionPrompt();
        }
    }

    /**
     * Check if player is overlapping any NPC zone (manual check for systems without physics)
     */
    checkPlayerOverlap(playerX: number, playerY: number) {
        let foundOverlap = false;

        this.triggerZones.forEach((zone, key) => {
            const npcName = key.split('_')[0];
            const bounds = zone.getBounds();

            if (bounds.contains(playerX, playerY)) {
                foundOverlap = true;
                this.handlePlayerEnterZone(npcName);
            } else if (this.currentOverlapNpc === npcName) {
                this.handlePlayerLeaveZone(npcName);
            }
        });

        if (!foundOverlap && this.currentOverlapNpc) {
            const previousNpc = this.currentOverlapNpc;
            this.currentOverlapNpc = null;
            const npc = this.npcs.get(previousNpc);
            if (npc) {
                npc.hideInteractionPrompt();
            }
        }
    }

    /**
     * Handle E key press for interaction
     */
    handleInteractionKey() {
        if (!this.currentOverlapNpc) return;

        const npc = this.npcs.get(this.currentOverlapNpc);
        if (!npc) return;

        const config = npc.getConfig();

        // Emit interaction event
        if (this.onInteractionRequested) {
            this.onInteractionRequested({
                npcName: config.name,
                npcDisplayName: config.displayName,
                npcConfig: config
            });
        }
    }

    /**
     * Set callback for interaction requests
     */
    setInteractionCallback(callback: (event: NpcInteractionEvent) => void) {
        this.onInteractionRequested = callback;
    }

    /**
     * Get current overlapping NPC
     */
    getCurrentNpc(): string | null {
        return this.currentOverlapNpc;
    }

    /**
     * Get NPC by name
     */
    getNpc(npcName: string): NpcSprite | undefined {
        return this.npcs.get(npcName);
    }

    /**
     * Cleanup all NPCs and zones
     */
    cleanup() {
        this.npcs.forEach(npc => npc.destroy());
        this.npcs.clear();

        this.triggerZones.forEach(zone => zone.destroy());
        this.triggerZones.clear();

        this.currentOverlapNpc = null;
    }

    /**
     * Update method (call from scene update)
     */
    update(playerX?: number, playerY?: number) {
        // Manual overlap checking if physics not available
        if (playerX !== undefined && playerY !== undefined) {
            this.checkPlayerOverlap(playerX, playerY);
        }
    }
}

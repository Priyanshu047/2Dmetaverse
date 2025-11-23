import Phaser from 'phaser';
import { io, Socket } from 'socket.io-client';
import { SpatialAudioManager } from '../../../../audio/SpatialAudioManager';
import type {
    RoomPlayer,
    PlayerMoveData,
    RoomStateData,
    PlayerJoinedData,
    PlayerMovedData,
    PlayerLeftData,
} from '../../../../game/types';
import { RoomLayout, GameZoneConfig } from '@metaverse/shared';
import { QuizScene } from './QuizScene';

const SOCKET_URL = 'http://localhost:3001';

interface WASDKeys {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
}

export class RoomScene extends Phaser.Scene {
    // Scene data
    private roomId!: string;
    private userId!: string;
    private username!: string;
    private avatarColor!: string;
    private onAvatarClick?: (userId: string) => void;
    private roomLayout?: RoomLayout;
    private activeGameZone?: GameZoneConfig;
    private interactionText?: Phaser.GameObjects.Text;
    private eKey!: Phaser.Input.Keyboard.Key;

    // Socket.io
    private socket!: Socket;

    // Player objects
    private player!: Phaser.GameObjects.Rectangle;
    private playerLabel!: Phaser.GameObjects.Text;
    private playerSpeed = 200;

    // Other players
    private otherPlayers: Map<
        string,
        { avatar: Phaser.GameObjects.Rectangle; label: Phaser.GameObjects.Text }
    > = new Map();

    // Input
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private wasd!: WASDKeys;

    // Movement tracking
    private lastEmitTime = 0;
    private emitInterval = 100; // Emit position every 100ms

    // Spatial audio tracking
    private spatialAudioUpdateTime = 0;
    private spatialAudioUpdateInterval = 100; // Update spatial audio every 100ms

    constructor() {
        super({ key: 'RoomScene' });
    }

    preload() {
        this.load.image('map-background', '/src/assets/map-background.jpg');
    }

    /**
     * Initialize scene with room and user data
     */
    init(data: {
        roomId: string;
        userId: string;
        name: string;
        avatarColor: string;
        onAvatarClick?: (userId: string) => void;
        roomLayout?: RoomLayout;
    }) {
        this.roomId = data.roomId;
        this.userId = data.userId;
        this.username = data.name;
        this.avatarColor = data.avatarColor;
        this.onAvatarClick = data.onAvatarClick;
        this.roomLayout = data.roomLayout;

        console.log('🎮 RoomScene initialized:', { roomId: this.roomId, userId: this.userId, hasLayout: !!this.roomLayout });
    }

    /**
     * Create the game world and setup networking
     */
    create() {
        // Create simple room background (dark blue-gray)
        // this.add.rectangle(400, 300, 800, 600, 0x2c3e50);

        // Set world bounds to fixed size
        this.physics.world.setBounds(0, 0, 800, 600);

        // Add custom map background - fullscreen and static
        const bg = this.add.image(0, 0, 'map-background');
        bg.setOrigin(0, 0);
        bg.setDisplaySize(this.scale.width, this.scale.height);
        bg.setScrollFactor(0);
        bg.setDepth(-1); // Ensure it's behind everything

        // Add walls for visual clarity
        this.add.rectangle(400, 10, 800, 20, 0x34495e); // Top
        this.add.rectangle(400, 590, 800, 20, 0x34495e); // Bottom
        this.add.rectangle(10, 300, 20, 600, 0x34495e); // Left
        this.add.rectangle(790, 300, 20, 600, 0x34495e); // Right

        // Create local player avatar with color
        const colorInt = parseInt(this.avatarColor.replace('#', ''), 16);
        this.player = this.add.rectangle(400, 300, 30, 30, colorInt);
        this.player.setStrokeStyle(3, 0xffffff); // White outline for local player

        // Add player name label
        this.playerLabel = this.add.text(this.player.x, this.player.y - 25, this.username, {
            fontSize: '12px',
            color: '#ffffff',
            backgroundColor: '#000000aa',
            padding: { x: 4, y: 2 },
        });
        this.playerLabel.setOrigin(0.5);

        // Setup keyboard controls (both Arrow keys and WASD)
        this.cursors = this.input.keyboard!.createCursorKeys();
        this.wasd = {
            up: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            down: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            left: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
        };
        this.eKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);

        // Setup Game Zones
        this.setupGameZones();

        // Setup Interaction UI
        this.interactionText = this.add.text(400, 500, '', {
            fontSize: '16px',
            color: '#ffffff',
            backgroundColor: '#000000aa',
            padding: { x: 8, y: 4 }
        }).setOrigin(0.5).setDepth(100).setVisible(false);

        // Add instruction text
        const instructionText = this.add.text(
            400,
            30,
            'Use Arrow Keys or WASD to Move',
            {
                fontSize: '14px',
                color: '#ffffff',
                backgroundColor: '#000000aa',
                padding: { x: 8, y: 4 },
            }
        );
        instructionText.setOrigin(0.5);

        // Initialize Socket.io connection
        this.initializeSocket();

        // Listen for game joined event
        this.events.on('resume', () => {
            console.log('🔄 RoomScene resumed');
            this.activeGameZone = undefined;
            this.interactionText?.setVisible(false);
        });
    }

    private setupGameZones() {
        if (!this.roomLayout?.gameZones) return;

        console.log('🎯 Setting up game zones:', this.roomLayout.gameZones);

        this.roomLayout.gameZones.forEach(zone => {
            // Visual indicator (semi-transparent)
            const graphics = this.add.graphics();
            graphics.fillStyle(0x00ff00, 0.2);
            graphics.fillRect(zone.x, zone.y, zone.width, zone.height);

            // Label
            this.add.text(zone.x + zone.width / 2, zone.y + zone.height / 2, `🎮 ${zone.type.toUpperCase()}`, {
                fontSize: '14px',
                color: '#ffffff'
            }).setOrigin(0.5);

            // Physics zone (invisible)
            const zoneObj = this.add.zone(zone.x + zone.width / 2, zone.y + zone.height / 2, zone.width, zone.height);
            this.physics.add.existing(zoneObj, true); // Static body

            // Overlap check
            this.physics.add.overlap(this.player, zoneObj, () => {
                this.activeGameZone = zone;
                this.interactionText?.setText(`Press E to join ${zone.type.toUpperCase()}`).setVisible(true);
            });
        });
    }

    /**
     * Setup Socket.io client and event handlers
     */
    private initializeSocket() {
        console.log('🔌 Connecting to Socket.io server...');
        this.socket = io(SOCKET_URL);

        // Remove all existing listeners to prevent duplicates
        this.socket.removeAllListeners();

        // Connection established
        this.socket.on('connect', () => {
            console.log('✅ Socket connected:', this.socket.id);

            // Join the room
            this.socket.emit('room:join', {
                roomId: this.roomId,
                userId: this.userId,
                name: this.username,
                avatarColor: this.avatarColor,
            });
        });

        // Receive initial room state (existing players)
        this.socket.on('room:state', this.handleRoomState.bind(this));

        // New player joined the room
        this.socket.on('player:joined', this.handlePlayerJoined.bind(this));

        // Player moved
        this.socket.on('player:moved', this.handlePlayerMoved.bind(this));

        // Player left the room
        this.socket.on('player:left', this.handlePlayerLeft.bind(this));

        // Disconnection
        this.socket.on('disconnect', () => {
            console.log('🔴 Socket disconnected');
        });

        // Error handling
        this.socket.on('error', (error: any) => {
            console.error('❌ Socket error:', error);
        });

        // Game Join Handler
        this.socket.on('game:joined', (data: any) => {
            console.log('🎮 Joined game:', data);
            this.scene.pause();
            this.scene.launch('QuizScene', {
                socket: this.socket,
                session: data.initialState,
                userId: this.userId
            });
        });
    }

    /**
     * Handle initial room state with existing players
     */
    private handleRoomState(data: RoomStateData) {
        console.log('📦 Received room state:', data);

        data.players.forEach((player: RoomPlayer) => {
            // Don't create avatar for ourselves
            if (player.id !== this.userId) {
                this.createOtherPlayer(player);
            }
        });
    }

    /**
     * Handle new player joining
     */
    private handlePlayerJoined(player: PlayerJoinedData) {
        console.log('👤 Player joined:', player);

        // Don't create avatar for ourselves
        if (player.id !== this.userId) {
            this.createOtherPlayer(player);
        }
    }

    /**
     * Handle player movement update
     */
    private handlePlayerMoved(data: PlayerMovedData) {
        const playerData = this.otherPlayers.get(data.playerId);

        if (playerData) {
            // Update position smoothly
            playerData.avatar.setPosition(data.x, data.y);
            playerData.label.setPosition(data.x, data.y - 25);
        }
    }

    /**
     * Handle player leaving
     */
    private handlePlayerLeft(data: PlayerLeftData) {
        console.log('👋 Player left:', data.playerId);

        const playerData = this.otherPlayers.get(data.playerId);
        if (playerData) {
            playerData.avatar.destroy();
            playerData.label.destroy();
            this.otherPlayers.delete(data.playerId);
        }
    }

    /**
     * Create avatar for another player
     */
    private createOtherPlayer(player: RoomPlayer | PlayerJoinedData) {
        // Prevent duplicates - if player already exists, skip creation
        if (this.otherPlayers.has(player.id)) {
            console.log(`⚠️  Player ${player.name} (${player.id}) already exists, skipping creation`);
            return;
        }

        // Parse color
        const colorInt = parseInt(player.avatarColor.replace('#', ''), 16);

        // Create avatar
        const avatar = this.add.rectangle(player.x, player.y, 30, 30, colorInt);

        // Make avatar interactive for clicking
        avatar.setInteractive({ useHandCursor: true });

        // Add click handler
        avatar.on('pointerdown', () => {
            console.log('🖱️ Avatar clicked:', player.id, player.name);
            if (this.onAvatarClick) {
                this.onAvatarClick(player.id);
            }
        });

        // Add hover effect
        avatar.on('pointerover', () => {
            avatar.setStrokeStyle(3, 0xffff00); // Yellow outline on hover
        });

        avatar.on('pointerout', () => {
            avatar.setStrokeStyle(0); // Remove outline
        });

        // Create name label
        const label = this.add.text(player.x, player.y - 25, player.name, {
            fontSize: '12px',
            color: '#ffffff',
            backgroundColor: '#000000aa',
            padding: { x: 4, y: 2 },
        });
        label.setOrigin(0.5);

        // Store reference
        this.otherPlayers.set(player.id, { avatar, label });

        console.log(`➕ Created avatar for ${player.name} (${player.id})`);
    }

    /**
     * Game loop - handle input and update positions
     */
    update(time: number, delta: number) {
        if (!this.player || !this.cursors || !this.wasd) return;

        let moved = false;
        const deltaSeconds = delta / 1000;

        // Check both arrow keys and WASD
        const left = this.cursors.left.isDown || this.wasd.left.isDown;
        const right = this.cursors.right.isDown || this.wasd.right.isDown;
        const up = this.cursors.up.isDown || this.wasd.up.isDown;
        const down = this.cursors.down.isDown || this.wasd.down.isDown;

        // Update player position
        if (left) {
            this.player.x -= this.playerSpeed * deltaSeconds;
            moved = true;
        } else if (right) {
            this.player.x += this.playerSpeed * deltaSeconds;
            moved = true;
        }

        if (up) {
            this.player.y -= this.playerSpeed * deltaSeconds;
            moved = true;
        } else if (down) {
            this.player.y += this.playerSpeed * deltaSeconds;
            moved = true;
        }

        // Constrain to room bounds
        this.player.x = Phaser.Math.Clamp(this.player.x, 30, 770);
        this.player.y = Phaser.Math.Clamp(this.player.y, 30, 570);

        // Update label position
        this.playerLabel.setPosition(this.player.x, this.player.y - 25);

        // Emit position to server (throttled)
        if (moved && time - this.lastEmitTime > this.emitInterval) {
            this.emitPlayerMove();
            this.lastEmitTime = time;
        }

        // Update spatial audio positions (throttled)
        if (time - this.spatialAudioUpdateTime > this.spatialAudioUpdateInterval) {
            this.updateSpatialAudioPositions();
            this.spatialAudioUpdateTime = time;
        }

        // Check interaction
        if (this.activeGameZone && Phaser.Input.Keyboard.JustDown(this.eKey)) {
            this.joinGame(this.activeGameZone);
        }

        // Reset active zone if not overlapping (simple check)
        // Note: The physics overlap callback runs every frame, so we can reset it at start of update
        // But simpler is to just hide text if we moved far away? 
        // Actually, physics overlap is better. Let's reset activeGameZone at start of update?
        // No, overlap happens during physics step.
        // Let's just check distance or rely on overlap.
        // A robust way: set activeGameZone = undefined at start of update, then overlap sets it.
        this.activeGameZone = undefined;
        this.interactionText?.setVisible(false);
    }

    private joinGame(zone: GameZoneConfig) {
        console.log('🚀 Joining game:', zone);
        this.socket.emit('game:join', {
            roomId: this.roomId,
            zoneId: zone.id,
            gameId: zone.gameId,
            userId: this.userId,
            username: this.username
        });
    }

    /**
     * Update spatial audio positions for all remote players
     */
    private updateSpatialAudioPositions() {
        if (!this.player) return;

        const manager = SpatialAudioManager.getInstance();
        const localX = this.player.x;
        const localY = this.player.y;

        // Update each remote player's audio position relative to local player
        this.otherPlayers.forEach((playerData, peerId) => {
            const deltaX = playerData.avatar.x - localX;
            const deltaY = playerData.avatar.y - localY;

            // Update 3D audio position
            manager.updatePeerPosition(peerId, deltaX, deltaY);
        });
    }

    /**
     * Emit player movement to server
     */
    private emitPlayerMove() {
        if (this.socket && this.socket.connected) {
            const moveData: PlayerMoveData = {
                x: this.player.x,
                y: this.player.y,
            };

            this.socket.emit('player:move', moveData);
        }
    }

    /**
     * Clean up when scene is destroyed
     */
    shutdown() {
        console.log('🧹 Shutting down RoomScene...');

        // Disconnect socket and remove all listeners
        if (this.socket) {
            this.socket.removeAllListeners();
            this.socket.disconnect();
        }

        // Clear all players
        this.otherPlayers.forEach(playerData => {
            playerData.avatar?.destroy();
            playerData.label?.destroy();
        });
        this.otherPlayers.clear();
    }
}

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

// Import avatar images
import user1 from '../../../../assets/avatars/user1.png';
import user2 from '../../../../assets/avatars/user2.png';
import user3 from '../../../../assets/avatars/user3.png';
import user4 from '../../../../assets/avatars/user4.png';
import user5 from '../../../../assets/avatars/user5.png';
import user6 from '../../../../assets/avatars/user6.png';
import user7 from '../../../../assets/avatars/user7.png';

const AVATAR_IMAGES = [user1, user2, user3, user4, user5, user6, user7];

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
    // Using Sprite with physics body and random avatar
    private player!: Phaser.GameObjects.Sprite;
    private playerLabel!: Phaser.GameObjects.Text;
    private playerSpeed = 200;
    private playerAvatarKey!: string;

    // Other players
    private otherPlayers: Map<
        string,
        { avatar: Phaser.GameObjects.Sprite; label: Phaser.GameObjects.Text }
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

    private isSceneReady = false;

    constructor() {
        super({ key: 'RoomScene' });
    }

    preload() {
        // Load map background from public assets
        this.load.image('map-background', '/assets/map-background.jpg');

        // Load user avatar images (7 images total)
        AVATAR_IMAGES.forEach((img, index) => {
            this.load.image(`user${index + 1}`, img);
        });

        this.load.on('loaderror', (file: any) => {
            console.error('❌ Error loading asset:', file.key, file.src);
        });
    }

    /**
     * Set the socket instance dynamically
     */
    public setSocket(socket: Socket) {
        if (this.socket === socket) return;
        this.socket = socket;
        console.log('🔌 Socket updated in RoomScene:', socket.id);

        // Only initialize listeners if scene is ready
        if (this.isSceneReady) {
            this.initializeSocket();
        }
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
        socket?: Socket;
    }) {
        this.roomId = data.roomId;
        this.userId = data.userId;
        this.username = data.name;
        this.avatarColor = data.avatarColor;
        this.onAvatarClick = data.onAvatarClick;
        this.roomLayout = data.roomLayout;
        this.isSceneReady = false; // Reset ready state

        if (data.socket) {
            this.setSocket(data.socket);
        }

        console.log('🎮 RoomScene initialized:', { roomId: this.roomId, userId: this.userId, hasLayout: !!this.roomLayout, hasSocket: !!this.socket });
    }

    /**
     * Create the game world and setup networking
     */
    create() {
        // Set world bounds to fixed size
        this.physics.world.setBounds(0, 0, 800, 600);

        // Add custom map background - fullscreen and static
        if (this.textures.exists('map-background')) {
            const bg = this.add.image(0, 0, 'map-background');
            bg.setOrigin(0, 0);
            bg.setDisplaySize(this.scale.width, this.scale.height);
            bg.setScrollFactor(0);
            bg.setDepth(-1); // Ensure it's behind everything
        } else {
            console.error('❌ map-background texture missing!');
            // Fallback background
            this.add.rectangle(0, 0, 800, 600, 0x2c3e50).setOrigin(0, 0).setDepth(-1);
        }

        // Render layout if available
        if (this.roomLayout) {
            this.renderLayout(this.roomLayout);
            this.setupGameZones();
        }

        // Add walls for visual clarity
        this.add.rectangle(400, 10, 800, 20, 0x34495e); // Top
        this.add.rectangle(400, 590, 800, 20, 0x34495e); // Bottom
        this.add.rectangle(10, 300, 20, 600, 0x34495e); // Left
        this.add.rectangle(790, 300, 20, 600, 0x34495e); // Right

        // Create player avatar
        this.createPlayer();

        // Setup Input
        this.setupInput();

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

        // Mark scene as ready
        this.isSceneReady = true;

        // Initialize Socket.io connection now that scene is ready
        if (this.socket) {
            this.initializeSocket();
        }

        // Setup spatial audio
        this.setupSpatialAudio();

        // Click to focus game
        this.input.on('pointerdown', () => {
            console.log('🖱️ Game focused');
            this.game.canvas.focus();
        });

        // Listen for game joined event
        this.events.on('resume', () => {
            console.log('🔄 RoomScene resumed');
            this.activeGameZone = undefined;
            this.interactionText?.setVisible(false);
        });
    }

    private createPlayer() {
        console.log('👤 Creating player for:', this.userId);

        // Select random avatar image (1-7)
        const randomAvatar = Math.floor(Math.random() * 7) + 1;
        this.playerAvatarKey = `user${randomAvatar}`;

        console.log(`🎨 Selected avatar: ${this.playerAvatarKey}`);

        // Create sprite avatar
        this.player = this.add.sprite(400, 300, this.playerAvatarKey);
        this.player.setScale(0.5); // Scale down if needed
        this.player.setDisplaySize(50, 50); // Set consistent display size

        // Enable physics
        this.physics.add.existing(this.player);
        const body = this.player.body as Phaser.Physics.Arcade.Body;
        body.setCollideWorldBounds(true);
        // Set physics body size to match visual size
        body.setSize(50, 50);

        // Add name label
        this.playerLabel = this.add.text(this.player.x, this.player.y - 35, this.username, {
            fontSize: '12px',
            color: '#ffffff',
            backgroundColor: '#000000aa',
            padding: { x: 4, y: 2 },
        });
        this.playerLabel.setOrigin(0.5);
    }

    private setupInput() {
        this.cursors = this.input.keyboard!.createCursorKeys();
        this.wasd = {
            up: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            down: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            left: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
        };
        this.eKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);

        // Debug input
        this.input.keyboard!.on('keydown', (event: KeyboardEvent) => {
            console.log('⌨️ Key down:', event.code);
        });
    }

    private setupSpatialAudio() {
        // Initialize spatial audio manager
        SpatialAudioManager.getInstance();
    }

    private renderLayout(layout: RoomLayout) {
        // Check if layoutJson exists and has walls/furniture
        if (!layout.layoutJson) return;

        const layoutData = layout.layoutJson;

        // Render walls if they exist
        if (layoutData.walls && Array.isArray(layoutData.walls)) {
            layoutData.walls.forEach((wall: any) => {
                const rect = this.add.rectangle(
                    wall.x + wall.width / 2,
                    wall.y + wall.height / 2,
                    wall.width,
                    wall.height,
                    0x7f8c8d
                );
                this.physics.add.existing(rect, true); // Static body
                this.physics.add.collider(this.player, rect);
            });
        }

        // Render furniture if it exists
        if (layoutData.furniture && Array.isArray(layoutData.furniture)) {
            layoutData.furniture.forEach((item: any) => {
                // Simple representation for now
                const rect = this.add.rectangle(
                    item.x + item.width / 2,
                    item.y + item.height / 2,
                    item.width,
                    item.height,
                    0x95a5a6
                );
                this.physics.add.existing(rect, true);
                this.physics.add.collider(this.player, rect);
            });
        }
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
        if (!this.socket) {
            console.error('❌ Socket not initialized in RoomScene!');
            return;
        }

        console.log('🔌 Using shared Socket.io connection:', this.socket.id);

        // DO NOT remove all listeners as we share the socket with React components!
        // Only remove listeners specific to this scene to prevent duplicates on restart
        this.socket.off('room:state');
        this.socket.off('player:joined');
        this.socket.off('player:moved');
        this.socket.off('player:left');
        this.socket.off('game:joined');

        // Connection established (if not already connected)
        if (!this.socket.connected) {
            this.socket.on('connect', () => {
                console.log('✅ Socket connected (in scene):', this.socket.id);
                this.joinRoom();
            });
        } else {
            // Already connected, just join
            this.joinRoom();
        }

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

    private joinRoom() {
        this.socket.emit('room:join', {
            roomId: this.roomId,
            userId: this.userId,
            name: this.username,
            avatarColor: this.avatarColor,
        });
    }

    /**
     * Handle initial room state with existing players
     */
    private handleRoomState(data: RoomStateData) {
        console.log('📦 Received room state:', data);
        console.log('👤 My User ID:', this.userId);

        data.players.forEach((player: RoomPlayer) => {
            console.log(`🔍 Checking player: ${player.id} (${player.name}) vs Me: ${this.userId}`);
            // Don't create avatar for ourselves (ensure string comparison)
            if (String(player.id) !== String(this.userId)) {
                this.createOtherPlayer(player);
            } else {
                console.log('🚫 Skipping creation for self');
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
            playerData.label.setPosition(data.x, data.y - 35);
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

        // Select random avatar image (1-7)
        const randomAvatar = Math.floor(Math.random() * 7) + 1;
        const avatarKey = `user${randomAvatar}`;

        console.log(`🎨 Selected avatar for ${player.name}: ${avatarKey}`);

        // Create sprite avatar
        const avatar = this.add.sprite(player.x, player.y, avatarKey);
        avatar.setDisplaySize(50, 50); // Set consistent display size

        // Enable physics
        this.physics.add.existing(avatar);
        const body = avatar.body as Phaser.Physics.Arcade.Body;
        body.setImmovable(true); // Other players are immovable
        body.setSize(50, 50);

        // Make avatar interactive for clicking
        avatar.setInteractive({ useHandCursor: true });

        // Add click handler
        avatar.on('pointerdown', () => {
            console.log('🖱️ Avatar clicked:', player.id, player.name);
            if (this.onAvatarClick) {
                this.onAvatarClick(player.id);
            }
        });

        // Add hover effect with tint
        avatar.on('pointerover', () => {
            avatar.setTint(0xffff00); // Yellow tint on hover
        });

        avatar.on('pointerout', () => {
            avatar.clearTint(); // Remove tint
        });

        // Add collision with local player
        this.physics.add.collider(this.player, avatar);

        // Create name label
        const label = this.add.text(player.x, player.y - 35, player.name, {
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
        const body = this.player.body as Phaser.Physics.Arcade.Body;

        // Check both arrow keys and WASD
        const left = this.cursors.left.isDown || this.wasd.left.isDown;
        const right = this.cursors.right.isDown || this.wasd.right.isDown;
        const up = this.cursors.up.isDown || this.wasd.up.isDown;
        const down = this.cursors.down.isDown || this.wasd.down.isDown;

        // Update player position
        if (left) {
            body.setVelocityX(-this.playerSpeed);
            moved = true;
        } else if (right) {
            body.setVelocityX(this.playerSpeed);
            moved = true;
        } else {
            body.setVelocityX(0);
        }

        if (up) {
            body.setVelocityY(-this.playerSpeed);
            moved = true;
        } else if (down) {
            body.setVelocityY(this.playerSpeed);
            moved = true;
        } else {
            body.setVelocityY(0);
        }

        // Update label position
        this.playerLabel.setPosition(this.player.x, this.player.y - 35);

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
            // Only remove listeners we added
            this.socket.off('room:state');
            this.socket.off('player:joined');
            this.socket.off('player:moved');
            this.socket.off('player:left');
            this.socket.off('game:joined');

            // DO NOT disconnect socket as it is shared!
            // this.socket.disconnect();
        }

        // Clear all players
        this.otherPlayers.forEach(playerData => {
            playerData.avatar?.destroy();
            playerData.label?.destroy();
        });
        this.otherPlayers.clear();
    }
}

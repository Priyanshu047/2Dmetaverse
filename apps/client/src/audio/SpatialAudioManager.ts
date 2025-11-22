/**
 * SpatialAudioManager - Manages 3D spatial audio using Web Audio API
 * 
 * This class creates a spatial audio system that positions remote peer audio
 * in 3D space based on their avatar positions in the Phaser 2D world.
 * 
 * Audio Graph per peer:
 * MediaStream → SourceNode → PannerNode → GainNode → Destination
 */

// Coordinate scaling: pixels to meters
const AUDIO_SCALE = 100;

interface SpatialPeer {
    sourceNode: MediaStreamAudioSourceNode;
    pannerNode: PannerNode;
    gainNode: GainNode;
    mediaStream: MediaStream;
}

export class SpatialAudioManager {
    private static instance: SpatialAudioManager | null = null;

    private audioContext: AudioContext | null = null;
    private masterGainNode: GainNode | null = null;
    private peers: Map<string, SpatialPeer> = new Map();
    private enabled: boolean = true;
    private masterVolume: number = 1.0;

    private constructor() {
        // Private constructor for singleton
    }

    /**
     * Get singleton instance
     */
    public static getInstance(): SpatialAudioManager {
        if (!SpatialAudioManager.instance) {
            SpatialAudioManager.instance = new SpatialAudioManager();
        }
        return SpatialAudioManager.instance;
    }

    /**
     * Check if Web Audio API is supported
     */
    public static isSupported(): boolean {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        return !!AudioContextClass;
    }

    /**
     * Initialize AudioContext (lazy initialization)
     */
    private initializeAudioContext(): void {
        if (this.audioContext) return;

        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;

        if (!AudioContextClass) {
            console.warn('Web Audio API not supported in this browser');
            return;
        }

        try {
            this.audioContext = new AudioContextClass();

            // Create master gain node
            this.masterGainNode = this.audioContext.createGain();
            this.masterGainNode.gain.value = this.masterVolume;
            this.masterGainNode.connect(this.audioContext.destination);

            console.log('✅ SpatialAudioManager: AudioContext initialized');
        } catch (error) {
            console.error('❌ Failed to initialize AudioContext:', error);
        }
    }

    /**
     * Add a peer's audio stream to spatial audio system
     */
    public addPeerAudio(peerId: string, mediaStream: MediaStream): void {
        if (!SpatialAudioManager.isSupported()) {
            console.warn('Spatial audio not supported, skipping peer audio setup');
            return;
        }

        // Initialize audio context if needed
        this.initializeAudioContext();

        if (!this.audioContext || !this.masterGainNode) {
            console.error('AudioContext not available');
            return;
        }

        // Check if peer already exists
        if (this.peers.has(peerId)) {
            console.warn(`Peer ${peerId} audio already added`);
            return;
        }

        // Check if stream has audio tracks
        const audioTracks = mediaStream.getAudioTracks();
        if (audioTracks.length === 0) {
            console.warn(`No audio tracks found for peer ${peerId}`);
            return;
        }

        try {
            // Create source node from media stream
            const sourceNode = this.audioContext.createMediaStreamSource(mediaStream);

            // Create panner node for 3D positioning
            const pannerNode = this.audioContext.createPanner();

            // Configure panner for HRTF spatial audio
            pannerNode.panningModel = 'HRTF';
            pannerNode.distanceModel = 'inverse';
            pannerNode.refDistance = 1;
            pannerNode.maxDistance = 1000;
            pannerNode.rolloffFactor = 1;
            pannerNode.coneInnerAngle = 360;
            pannerNode.coneOuterAngle = 0;
            pannerNode.coneOuterGain = 0;

            // Initial position (0, 0, 0) - will be updated
            pannerNode.positionX.value = 0;
            pannerNode.positionY.value = 0;
            pannerNode.positionZ.value = 0;

            // Create gain node for per-peer volume control
            const gainNode = this.audioContext.createGain();
            gainNode.gain.value = this.enabled ? 1.0 : 0.0;

            // Connect audio graph: source → panner → gain → master gain → destination
            sourceNode.connect(pannerNode);
            pannerNode.connect(gainNode);
            gainNode.connect(this.masterGainNode);

            // Store peer data
            this.peers.set(peerId, {
                sourceNode,
                pannerNode,
                gainNode,
                mediaStream,
            });

            console.log(`🎵 Added spatial audio for peer: ${peerId}`);
        } catch (error) {
            console.error(`Failed to add spatial audio for peer ${peerId}:`, error);
        }
    }

    /**
     * Remove a peer's audio from spatial audio system
     */
    public removePeerAudio(peerId: string): void {
        const peer = this.peers.get(peerId);

        if (!peer) {
            return;
        }

        try {
            // Disconnect all nodes
            peer.sourceNode.disconnect();
            peer.pannerNode.disconnect();
            peer.gainNode.disconnect();

            // Remove from map
            this.peers.delete(peerId);

            console.log(`🔇 Removed spatial audio for peer: ${peerId}`);
        } catch (error) {
            console.error(`Failed to remove spatial audio for peer ${peerId}:`, error);
        }
    }

    /**
     * Update a peer's 3D position based on avatar coordinates
     * @param peerId Peer identifier
     * @param deltaX Relative X position from local player (pixels)
     * @param deltaY Relative Y position from local player (pixels)
     */
    public updatePeerPosition(peerId: string, deltaX: number, deltaY: number): void {
        const peer = this.peers.get(peerId);

        if (!peer) {
            return;
        }

        try {
            // Convert 2D Phaser coordinates to 3D audio space
            // X axis: left/right (negative = left, positive = right)
            // Y axis: always 0 (2D world has no height)
            // Z axis: forward/back (positive Y in Phaser = positive Z in audio)

            const audioX = deltaX / AUDIO_SCALE;
            const audioY = 0; // No height in 2D world
            const audioZ = deltaY / AUDIO_SCALE;

            // Update panner node position
            peer.pannerNode.positionX.value = audioX;
            peer.pannerNode.positionY.value = audioY;
            peer.pannerNode.positionZ.value = audioZ;

        } catch (error) {
            console.error(`Failed to update position for peer ${peerId}:`, error);
        }
    }

    /**
     * Set master volume for all spatial audio (0.0 - 1.0)
     */
    public setMasterVolume(volume: number): void {
        this.masterVolume = Math.max(0, Math.min(1, volume));

        if (this.masterGainNode) {
            this.masterGainNode.gain.value = this.masterVolume;
        }

        console.log(`🔊 Spatial audio master volume: ${(this.masterVolume * 100).toFixed(0)}%`);
    }

    /**
     * Enable or disable spatial audio
     */
    public setEnabled(enabled: boolean): void {
        this.enabled = enabled;

        // Update all peer gain nodes
        this.peers.forEach((peer) => {
            peer.gainNode.gain.value = enabled ? 1.0 : 0.0;
        });

        console.log(`🎵 Spatial audio ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Get current enabled state
     */
    public isEnabled(): boolean {
        return this.enabled;
    }

    /**
     * Get current master volume
     */
    public getMasterVolume(): number {
        return this.masterVolume;
    }

    /**
     * Get number of active peers
     */
    public getPeerCount(): number {
        return this.peers.size;
    }

    /**
     * Dispose of all resources (call on app shutdown)
     */
    public dispose(): void {
        // Remove all peers
        const peerIds = Array.from(this.peers.keys());
        peerIds.forEach((peerId) => this.removePeerAudio(peerId));

        // Close audio context
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }

        this.masterGainNode = null;
        this.peers.clear();

        console.log('🛑 SpatialAudioManager disposed');
    }
}

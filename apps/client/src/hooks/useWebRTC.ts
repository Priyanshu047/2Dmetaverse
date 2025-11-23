import { useState, useEffect, useRef, useCallback } from 'react';
import SimplePeer from 'simple-peer';
import type { Socket } from 'socket.io-client';
import { SpatialAudioManager } from '../audio/SpatialAudioManager';

interface Peer {
    peer: SimplePeer.Instance;
    stream: MediaStream | null;
}

interface UseWebRTCReturn {
    localStream: MediaStream | null;
    peers: Map<string, Peer>;
    isMuted: boolean;
    isVideoOff: boolean;
    toggleMute: () => void;
    toggleVideo: () => void;
    isInitialized: boolean;
}

const ICE_SERVERS = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
];

export const useWebRTC = (
    socket: Socket | null,
    roomId: string | undefined,
    userId: string | undefined
): UseWebRTCReturn => {
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [peers, setPeers] = useState<Map<string, Peer>>(new Map());
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    const peersRef = useRef<Map<string, Peer>>(new Map());
    const localStreamRef = useRef<MediaStream | null>(null);

    // Initialize media devices
    const initializeMedia = useCallback(async () => {
        try {
            // IMPORTANT: Always request both audio and video for WebRTC to work
            // Even if user toggles camera/mic off, we need the tracks for peer connections
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
            });

            localStreamRef.current = stream;
            setLocalStream(stream);
            setIsInitialized(true);

            console.log('📹 Local media initialized:', stream.getTracks().map(t => `${t.kind}: ${t.label}`));
            console.log('🎤 Audio tracks:', stream.getAudioTracks().map(t => `enabled: ${t.enabled}`));
            console.log('📹 Video tracks:', stream.getVideoTracks().map(t => `enabled: ${t.enabled}`));
        } catch (error) {
            console.error('❌ Failed to get user media:', error);

            // Try audio-only fallback if video fails
            try {
                console.log('🔄 Trying audio-only fallback...');
                const audioOnlyStream = await navigator.mediaDevices.getUserMedia({
                    audio: true,
                    video: false,
                });
                localStreamRef.current = audioOnlyStream;
                setLocalStream(audioOnlyStream);
                setIsInitialized(true);
                setIsVideoOff(true); // Mark video as unavailable
                console.log('✅ Audio-only mode initialized');
            } catch (audioError) {
                console.error('❌ Failed to get any media:', audioError);
                // Allow WebRTC to proceed without local media (Receive Only)
                setIsInitialized(true);
                setIsVideoOff(true);
                setIsMuted(true);
            }
        }
    }, []);

    // Create peer connection
    const createPeer = useCallback(
        (peerId: string, initiator: boolean): SimplePeer.Instance => {
            console.log(`🔗 Creating peer connection with ${peerId}, initiator: ${initiator}`);

            const peer = new SimplePeer({
                initiator,
                trickle: true,
                config: { iceServers: ICE_SERVERS },
                stream: localStreamRef.current || undefined,
            });

            // Handle signaling data (offer/answer/ICE candidates)
            peer.on('signal', (signal) => {
                console.log(`📡 Sending signal to ${peerId}:`, signal.type);

                if (signal.type === 'offer') {
                    socket?.emit('webrtc:offer', {
                        targetId: peerId,
                        offer: signal,
                    });
                } else if (signal.type === 'answer') {
                    socket?.emit('webrtc:answer', {
                        targetId: peerId,
                        answer: signal,
                    });
                } else {
                    // ICE candidate
                    socket?.emit('webrtc:candidate', {
                        targetId: peerId,
                        candidate: signal,
                    });
                }
            });

            // Handle incoming stream
            peer.on('stream', (remoteStream: MediaStream) => {
                console.log(`📺 Received remote stream from ${peerId}`);

                setPeers((prevPeers) => {
                    const newPeers = new Map(prevPeers);
                    const existingPeer = newPeers.get(peerId);
                    if (existingPeer) {
                        newPeers.set(peerId, { ...existingPeer, stream: remoteStream });
                    }
                    return newPeers;
                });

                peersRef.current.get(peerId)!.stream = remoteStream;

                // SPATIAL AUDIO: Add peer audio to spatial audio manager
                const audioTracks = remoteStream.getAudioTracks();
                if (audioTracks.length > 0) {
                    SpatialAudioManager.getInstance().addPeerAudio(peerId, remoteStream);
                }
            });

            // Handle connection events
            peer.on('connect', () => {
                console.log(`✅ Connected to peer ${peerId}`);
            });

            peer.on('error', (err) => {
                console.error(`❌ Peer error with ${peerId}:`, err);
            });

            peer.on('close', () => {
                console.log(`🔌 Peer connection closed with ${peerId}`);
                removePeer(peerId);
            });

            return peer;
        },
        [socket]
    );

    // Add new peer
    const addPeer = useCallback(
        (peerId: string, initiator: boolean) => {
            if (peersRef.current.has(peerId)) {
                console.log(`⚠️ Peer ${peerId} already exists`);
                return;
            }

            try {
                const peer = createPeer(peerId, initiator);
                const peerData: Peer = { peer, stream: null };

                peersRef.current.set(peerId, peerData);
                setPeers(new Map(peersRef.current));

                console.log(`➕ Added peer ${peerId}, total peers: ${peersRef.current.size}`);
            } catch (err) {
                console.error(`❌ Failed to create peer ${peerId}:`, err);
            }
        },
        [createPeer]
    );

    // Remove peer
    const removePeer = useCallback((peerId: string) => {
        const peerData = peersRef.current.get(peerId);
        if (peerData) {
            peerData.peer.destroy();

            // SPATIAL AUDIO: Remove peer from spatial audio manager
            SpatialAudioManager.getInstance().removePeerAudio(peerId);

            peersRef.current.delete(peerId);
            setPeers(new Map(peersRef.current));
            console.log(`➖ Removed peer ${peerId}, remaining: ${peersRef.current.size}`);
        } else {
            console.warn(`⚠️ Attempted to remove non-existent peer ${peerId}`);
        }
    }, []);

    // Toggle mute
    const toggleMute = useCallback(() => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
                console.log(`🎤 Audio ${audioTrack.enabled ? 'unmuted' : 'muted'}`);
            }
        }
    }, []);

    // Toggle video
    const toggleVideo = useCallback(() => {
        if (localStreamRef.current) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoOff(!videoTrack.enabled);
                console.log(`📹 Video ${videoTrack.enabled ? 'enabled' : 'disabled'}`);
            }
        }
    }, []);

    // Initialize media on mount
    useEffect(() => {
        if (userId && roomId) {
            initializeMedia();
        }

        return () => {
            // Cleanup on unmount
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach((track) => track.stop());
            }
            peersRef.current.forEach((peerData) => peerData.peer.destroy());
            peersRef.current.clear();
        };
    }, [userId, roomId, initializeMedia]);

    // Add local stream to peers when it becomes available (fixes race condition)
    useEffect(() => {
        if (localStream && peersRef.current.size > 0) {
            console.log('🎥 Local stream ready, adding to existing peers');
            peersRef.current.forEach((peerData, peerId) => {
                try {
                    console.log(`🎥 Adding stream to peer ${peerId}`);
                    peerData.peer.addStream(localStream);
                } catch (err) {
                    console.warn(`⚠️ Could not add stream to peer ${peerId} (might already have it):`, err);
                }
            });
        }
    }, [localStream]);

    // Socket event listeners
    useEffect(() => {
        if (!socket || !isInitialized) return;

        console.log('🔌 Setting up WebRTC socket listeners for socket:', socket.id);

        // Handle new peer joined
        const handlePeerJoined = ({ peerId }: { peerId: string }) => {
            console.log(`👤 Peer joined event received: ${peerId}`);
            if (peerId !== userId) {
                console.log(`🚀 Initiating connection to ${peerId}`);
                addPeer(peerId, true); // We are the initiator
            } else {
                console.log('⚠️ Peer joined is self, ignoring');
            }
        };

        // Handle incoming offer
        const handleOffer = ({ sourceId, offer }: { sourceId: string; offer: SimplePeer.SignalData }) => {
            console.log(`📥 Received offer from ${sourceId}`);

            if (!peersRef.current.has(sourceId)) {
                console.log(`➕ Accepting offer from new peer ${sourceId}`);
                addPeer(sourceId, false); // We are the receiver
            }

            const peerData = peersRef.current.get(sourceId);
            if (peerData) {
                console.log(`📡 Signaling offer to peer ${sourceId}`);
                peerData.peer.signal(offer);
            } else {
                console.warn(`❌ Could not find peer ${sourceId} to signal offer`);
            }
        };

        // Handle incoming answer
        const handleAnswer = ({ sourceId, answer }: { sourceId: string; answer: SimplePeer.SignalData }) => {
            console.log(`📥 Received answer from ${sourceId}`);

            const peerData = peersRef.current.get(sourceId);
            if (peerData) {
                console.log(`📡 Signaling answer to peer ${sourceId}`);
                peerData.peer.signal(answer);
            } else {
                console.warn(`❌ Could not find peer ${sourceId} to signal answer`);
            }
        };

        // Handle ICE candidate
        const handleCandidate = ({ sourceId, candidate }: { sourceId: string; candidate: SimplePeer.SignalData }) => {
            console.log(`📥 Received ICE candidate from ${sourceId}`);

            const peerData = peersRef.current.get(sourceId);
            if (peerData) {
                peerData.peer.signal(candidate);
            } else {
                console.warn(`❌ Could not find peer ${sourceId} to signal candidate`);
            }
        };

        // Handle peer left
        const handleUserLeft = ({ playerId, socketId }: { playerId: string; socketId?: string }) => {
            console.log(`👋 Player left event: ${playerId}, socketId: ${socketId}`);
            removePeer(socketId || playerId);
        };

        socket.on('webrtc:peer-joined', handlePeerJoined);
        socket.on('webrtc:offer', handleOffer);
        socket.on('webrtc:answer', handleAnswer);
        socket.on('webrtc:candidate', handleCandidate);
        socket.on('player:left', handleUserLeft);

        return () => {
            console.log('🔌 Cleaning up WebRTC socket listeners');
            socket.off('webrtc:peer-joined', handlePeerJoined);
            socket.off('webrtc:offer', handleOffer);
            socket.off('webrtc:answer', handleAnswer);
            socket.off('webrtc:candidate', handleCandidate);
            socket.off('player:left', handleUserLeft);
        };
    }, [socket, isInitialized, userId, addPeer, removePeer]);

    return {
        localStream,
        peers,
        isMuted,
        isVideoOff,
        toggleMute,
        toggleVideo,
        isInitialized,
    };
};

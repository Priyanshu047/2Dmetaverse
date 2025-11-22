import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../hooks/useSocket';
import { useWebRTC } from '../hooks/useWebRTC';
import { useSpatialAudio } from '../hooks/useSpatialAudio';
import PhaserRoomCanvas from '../components/phaser/PhaserRoomCanvas';
import FloatingChat from '../components/FloatingChat';
import VideoGrid from '../components/webrtc/VideoGrid';
import ProfileModal from '../components/networking/ProfileModal';
import ProfileSettingsPanel from '../components/networking/ProfileSettingsPanel';
import type { ChatMessage, Room, NpcConfig } from '@metaverse/shared';
import { getRoom } from '../api/rooms';
import { getRoomNpcs } from '../api/npc';
import { chatWithNpc } from '../api/npc';
import { getProfile } from '../api/profile';
import { useConnections } from '../hooks/useConnections';
import type { UserProfile } from '../api/types/networking';

const RoomPage = () => {
    const { roomId } = useParams<{ roomId: string }>(); // roomId here is actually the slug
    const { user } = useAuth();
    const navigate = useNavigate();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [room, setRoom] = useState<Room | null>(null);
    const [loading, setLoading] = useState(true);
    const [npcs, setNpcs] = useState<NpcConfig[]>([]);
    const [isNpcThinking, setIsNpcThinking] = useState(false);
    // Profile modal state
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isProfileLoading, setIsProfileLoading] = useState(false);
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

    // Connection management
    const {
        getConnectionStatus,
        sendRequest,
        respondToRequest,
        getIncomingRequest,
    } = useConnections();

    // Fetch room data
    useEffect(() => {
        const fetchRoom = async () => {
            if (!roomId) return;
            try {
                const data = await getRoom(roomId);
                setRoom(data);
            } catch (error) {
                console.error('Failed to fetch room:', error);
                navigate('/rooms'); // Redirect to room list on error
            } finally {
                setLoading(false);
            }
        };

        fetchRoom();
    }, [roomId, navigate]);

    // Fetch NPCs for the room
    useEffect(() => {
        const fetchNpcs = async () => {
            if (!room) return;
            try {
                const roomNpcs = await getRoomNpcs(room.slug);
                setNpcs(roomNpcs);
            } catch (error) {
                console.error('Failed to fetch NPCs:', error);
            }
        };

        fetchNpcs();
    }, [room]);

    // Socket.io for chat and WebRTC signaling (separate from Phaser socket)
    const { socket, isConnected } = useSocket(
        roomId,
        user?.id,
        user?.username
    );

    // WebRTC integration
    const {
        localStream,
        peers,
        isMuted,
        isVideoOff,
        toggleMute,
        toggleVideo,
        isInitialized,
    } = useWebRTC(socket, roomId, user?.id);

    // Spatial audio controls
    const {
        isEnabled: spatialAudioEnabled,
        setIsEnabled: setSpatialAudioEnabled,
        masterVolume,
        setMasterVolume,
        isSupported: spatialAudioSupported,
    } = useSpatialAudio();

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        // Listen for chat messages
        const handleChatMessage = (message: ChatMessage) => {
            setMessages((prev) => [...prev, message]);
        };

        socket?.on('chat:message', handleChatMessage);

        return () => {
            socket?.off('chat:message', handleChatMessage);
        };
    }, [user, navigate]);

    const handleSendMessage = async (text: string) => {
        // Check for @mention pattern
        const mentionMatch = text.match(/@(\w+)\s+(.+)/);

        if (mentionMatch && room && user) {
            const [_, npcName, message] = mentionMatch;

            // Find NPC (case-insensitive)
            const npc = npcs.find(n =>
                n.name.toLowerCase() === npcName.toLowerCase()
            );

            if (npc) {
                // Send to NPC
                setIsNpcThinking(true);
                try {
                    const response = await chatWithNpc({
                        roomSlug: room.slug,
                        npcName: npc.name,
                        userId: user.id,
                        username: user.username,
                        message,
                        context: {
                            recentMessages: messages.slice(-5).map(m => ({
                                from: m.senderName,
                                text: m.text,
                                timestamp: Date.now()
                            })),
                            roomType: room.type
                        }
                    });

                    // Add user's message to chat
                    const userMsg: any = {
                        id: Date.now().toString(),
                        text: `@${npc.displayName} ${message}`,
                        senderId: user.id,
                        senderName: user.username,
                        timestamp: new Date().toISOString(),
                        type: 'user'
                    };

                    // Add NPC response to chat
                    const npcMsg: any = {
                        id: (Date.now() + 1).toString(),
                        text: response.text,
                        senderId: npc.name,
                        senderName: npc.name,
                        displayName: response.displayName,
                        timestamp: new Date().toISOString(),
                        type: 'npc'
                    };

                    setMessages(prev => [...prev, userMsg, npcMsg]);
                } catch (error) {
                    console.error('NPC chat error:', error);
                    // Add error message to chat
                    const errorMsg: any = {
                        id: Date.now().toString(),
                        text: "Sorry, I couldn't reach the NPC. Please try again.",
                        senderId: 'system',
                        senderName: 'System',
                        timestamp: new Date().toISOString(),
                        type: 'system'
                    };
                    setMessages(prev => [...prev, errorMsg]);
                } finally {
                    setIsNpcThinking(false);
                }
                return;
            } else {
                // NPC not found, show helpful message
                const helpMsg: any = {
                    id: Date.now().toString(),
                    text: `NPC "${npcName}" not found. Available NPCs: ${npcs.map(n => n.name).join(', ')}`,
                    senderId: 'system',
                    senderName: 'System',
                    timestamp: new Date().toISOString(),
                    type: 'system'
                };
                setMessages(prev => [...prev, helpMsg]);
                return;
            }
        }

        // Regular message
        if (isConnected) {
            socket?.emit('chat:message', { text } as any);
        }
    };

    // Handle avatar click in Phaser
    const handleAvatarClick = async (userId: string) => {
        try {
            setSelectedUserId(userId);
            setIsProfileModalOpen(true);
            setIsProfileLoading(true);

            const profile = await getProfile(userId);
            setSelectedProfile(profile);
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setIsProfileLoading(false);
        }
    };

    // Handle connection request
    const handleConnectClick = async () => {
        if (!selectedUserId) return;

        try {
            setIsProfileLoading(true);
            await sendRequest(selectedUserId);
        } catch (error) {
            console.error('Error sending connection request:', error);
        } finally {
            setIsProfileLoading(false);
        }
    };

    // Handle accept connection
    const handleAcceptClick = async () => {
        if (!selectedUserId) return;

        const request = getIncomingRequest(selectedUserId);
        if (!request) return;

        try {
            setIsProfileLoading(true);
            await respondToRequest(request.id, 'accept');
        } catch (error) {
            console.error('Error accepting connection:', error);
        } finally {
            setIsProfileLoading(false);
        }
    };

    // Handle reject connection
    const handleRejectClick = async () => {
        if (!selectedUserId) return;

        const request = getIncomingRequest(selectedUserId);
        if (!request) return;

        try {
            setIsProfileLoading(true);
            await respondToRequest(request.id, 'reject');
            setIsProfileModalOpen(false);
        } catch (error) {
            console.error('Error rejecting connection:', error);
        } finally {
            setIsProfileLoading(false);
        }
    };

    const handleLeaveRoom = () => {
        if (isConnected && roomId) {
            socket?.emit('room:leave', { roomId });
        }
        navigate('/rooms');
    };

    if (!user) return null;

    if (loading) {
        return (
            <div className="h-screen bg-gray-900 flex items-center justify-center text-white">
                Loading room...
            </div>
        );
    }

    if (!room) return null;

    // Generate avatar color based on user ID (simple hash)
    const generateAvatarColor = (id: string): string => {
        let hash = 0;
        for (let i = 0; i < id.length; i++) {
            hash = id.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hue = hash % 360;
        return `hsl(${hue}, 70%, 60%)`;
    };

    const avatarColor = generateAvatarColor(user.id);

    return (
        <div className="h-screen bg-gray-900 flex flex-col">
            {/* Header */}
            <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-white">{room.name}</h1>
                        <p className="text-gray-400 text-sm">
                            {room.description}
                            <span className="mx-2">|</span>
                            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
                            {isInitialized && ' | 📹 WebRTC Ready'}
                        </p>
                    </div>
                    <button
                        onClick={() => setIsEditProfileOpen(true)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition mr-2"
                    >
                        Edit Profile
                    </button>
                    <button
                        onClick={handleLeaveRoom}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                    >
                        Leave Room
                    </button>
                </div>
            </div>

            {/* Main content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Game canvas - Left side */}
                <div className="flex-1 flex items-center justify-center bg-gray-800 p-4">
                    <PhaserRoomCanvas
                        roomId={roomId!}
                        user={{
                            id: user.id,
                            name: user.username,
                            avatarColor: avatarColor,
                        }}
                        roomLayout={room.layout}
                        onAvatarClick={handleAvatarClick}
                    />
                </div>

                {/* Right sidebar - Video + Chat */}
                <div className="w-96 bg-gray-800 border-l border-gray-700 flex flex-col">
                    {/* Video Grid */}
                    <div className="border-b border-gray-700">
                        <VideoGrid
                            localStream={localStream}
                            peers={peers}
                            localPeerId={user.id}
                        />
                    </div>

                    {/* Video Controls */}
                    <div className="p-4 border-b border-gray-700 bg-gray-900">
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={toggleMute}
                                className={`px-4 py-3 rounded-lg font-semibold transition ${isMuted
                                    ? 'bg-red-600 hover:bg-red-700 text-white'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                                    }`}
                            >
                                {isMuted ? '🔇 Unmute' : '🎤 Mute'}
                            </button>

                            <button
                                onClick={toggleVideo}
                                className={`px-4 py-3 rounded-lg font-semibold transition ${isVideoOff
                                    ? 'bg-red-600 hover:bg-red-700 text-white'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                                    }`}
                            >
                                {isVideoOff ? '📹 Start Video' : '🎥 Stop Video'}
                            </button>
                        </div>
                    </div>

                    {/* Spatial Audio Controls */}
                    <div className="p-4 border-b border-gray-700 bg-gray-900">
                        <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                            <span>🎧</span>
                            <span>Spatial Audio</span>
                        </h3>

                        {spatialAudioSupported ? (
                            <>
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-gray-300 text-sm">Enable 3D Audio</span>
                                    <button
                                        onClick={() => setSpatialAudioEnabled(!spatialAudioEnabled)}
                                        className={`px-3 py-1 rounded-lg font-semibold text-sm transition ${spatialAudioEnabled
                                            ? 'bg-green-600 hover:bg-green-700 text-white'
                                            : 'bg-gray-600 hover:bg-gray-700 text-white'
                                            }`}
                                    >
                                        {spatialAudioEnabled ? 'ON' : 'OFF'}
                                    </button>
                                </div>

                                <div>
                                    <label className="text-gray-300 text-sm block mb-2 flex items-center justify-between">
                                        <span>Volume</span>
                                        <span className="text-white font-semibold">{masterVolume}%</span>
                                    </label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={masterVolume}
                                        onChange={(e) => setMasterVolume(Number(e.target.value))}
                                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                    />
                                </div>
                            </>
                        ) : (
                            <p className="text-gray-400 text-sm">
                                ⚠️ Not supported in this browser
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Floating Chat Window */}
            <FloatingChat
                messages={messages}
                onSendMessage={handleSendMessage}
                username={user.username}
                isNpcThinking={isNpcThinking}
            />

            {/* Profile Modal */}
            <ProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => {
                    setIsProfileModalOpen(false);
                    setSelectedUserId(null);
                    setSelectedProfile(null);
                }}
                profile={selectedProfile}
                connectionStatus={selectedUserId ? getConnectionStatus(selectedUserId) : 'none'}
                onConnectClick={handleConnectClick}
                onAcceptClick={handleAcceptClick}
                onRejectClick={handleRejectClick}
                isLoading={isProfileLoading}
            />
            {/* Edit Profile Modal */}
            {isEditProfileOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
                    <div className="relative w-full max-w-3xl">
                        <button
                            onClick={() => setIsEditProfileOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white z-10"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <ProfileSettingsPanel
                            userId={user.id}
                            onSave={() => {
                                // Optional: close modal after save or just show success message
                                // setIsEditProfileOpen(false);
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoomPage;

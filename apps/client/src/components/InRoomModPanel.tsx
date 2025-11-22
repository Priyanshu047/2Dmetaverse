import React, { useState, useEffect } from 'react';
import { useSocket } from '../hooks/useSocket';

interface RoomUser {
    id: string;
    name: string;
    avatarColor?: string;
}

interface InRoomModPanelProps {
    roomId: string;
    currentUserId: string;
    currentUserRole: string;
}

/**
 * InRoomModPanel Component
 * Moderation controls shown to moderators/admins inside a room
 */
const InRoomModPanel: React.FC<InRoomModPanelProps> = ({
    roomId,
    currentUserId,
    currentUserRole,
}) => {
    const { socket } = useSocket();
    const [roomUsers, setRoomUsers] = useState<RoomUser[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    // Only show for moderators and admins
    if (currentUserRole !== 'moderator' && currentUserRole !== 'admin') {
        return null;
    }

    const handleMute = (targetUserId: string) => {
        if (!socket) return;

        socket.emit('admin:mute', {
            targetUserId,
            roomId,
            reason: 'Muted from in-room panel',
        });
    };

    const handleUnmute = (targetUserId: string) => {
        if (!socket) return;

        socket.emit('admin:unmute', {
            targetUserId,
            roomId,
        });
    };

    const handleKick = (targetUserId: string, userName: string) => {
        if (!socket) return;

        const confirmed = window.confirm(
            `Are you sure you want to kick ${userName} from this room?`
        );

        if (confirmed) {
            socket.emit('admin:kick', {
                targetUserId,
                roomId,
                reason: 'Removed by moderator',
            });
        }
    };

    // Listen for admin events
    useEffect(() => {
        if (!socket) return;

        const handleSuccess = (data: { message: string }) => {
            alert(data.message);
        };

        const handleError = (data: { message: string }) => {
            alert('Error: ' + data.message);
        };

        socket.on('admin:success', handleSuccess);
        socket.on('admin:error', handleError);

        return () => {
            socket.off('admin:success', handleSuccess);
            socket.off('admin:error', handleError);
        };
    }, [socket]);

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-20 right-4 bg-yellow-600 hover:bg-yellow-700 text-white p-4 rounded-full shadow-lg z-50"
                title="Moderation Panel"
            >
                🛡️
            </button>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl z-50">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-gray-700 bg-gray-900">
                <div className="flex items-center gap-2">
                    <span>🛡️</span>
                    <h3 className="font-bold text-white">Mod Panel</h3>
                </div>
                <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-white"
                >
                    ✕
                </button>
            </div>

            {/* User List */}
            <div className="p-3 max-h-96 overflow-y-auto">
                <div className="text-sm text-gray-400 mb-2">
                    Room Users ({roomUsers.length})
                </div>

                {roomUsers.length === 0 ? (
                    <div className="text-gray-500 text-sm text-center py-4">
                        No users to display.
                        <br />
                        <span className="text-xs">
                            (Users will appear when room state updates)
                        </span>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {roomUsers.map((user) => (
                            <div
                                key={user.id}
                                className="bg-gray-700 p-2 rounded flex items-center justify-between"
                            >
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-6 h-6 rounded-full"
                                        style={{
                                            backgroundColor: user.avatarColor || '#3498db',
                                        }}
                                    />
                                    <span className="text-white text-sm">{user.name}</span>
                                </div>

                                {user.id !== currentUserId && (
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => handleMute(user.id)}
                                            className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs px-2 py-1 rounded"
                                            title="Mute"
                                        >
                                            🔇
                                        </button>
                                        <button
                                            onClick={() => handleKick(user.id, user.name)}
                                            className="bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1 rounded"
                                            title="Kick"
                                        >
                                            🚫
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Note */}
            <div className="p-2 border-t border-gray-700 bg-gray-900 text-xs text-gray-500">
                Use these controls to manage users in this room.
            </div>
        </div>
    );
};

export default InRoomModPanel;

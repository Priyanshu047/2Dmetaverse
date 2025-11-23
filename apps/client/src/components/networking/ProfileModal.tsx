import React from 'react';
import { UserProfile } from '../../api/types/networking';
import { UserConnectionStatus } from '../../hooks/useConnections';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    profile: UserProfile | null;
    connectionStatus?: UserConnectionStatus;
    onConnectClick?: () => void;
    onAcceptClick?: () => void;
    onRejectClick?: () => void;
    isLoading?: boolean;
    isAdmin?: boolean;
    onKick?: () => void;
    onMute?: () => void;
    onBlock?: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({
    isOpen,
    onClose,
    profile,
    connectionStatus = 'none',
    onConnectClick,
    onAcceptClick,
    onRejectClick,
    isLoading = false,
    isAdmin = false,
    onKick,
    onMute,
    onBlock,
}) => {
    if (!isOpen || !profile) return null;

    // Generate avatar initials from userId or username
    const getInitials = (userId: string): string => {
        return userId.substring(0, 2).toUpperCase();
    };

    // Generate avatar color based on userId
    const getAvatarColor = (userId: string): string => {
        let hash = 0;
        for (let i = 0; i < userId.length; i++) {
            hash = userId.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hue = hash % 360;
        return `hsl(${hue}, 70%, 60%)`;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 h-32">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white hover:text-gray-200 transition"
                    >
                        <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                {/* Profile Content */}
                <div className="px-6 pb-6 -mt-16">
                    {/* Avatar */}
                    <div
                        className="w-24 h-24 rounded-full border-4 border-gray-800 flex items-center justify-center text-2xl font-bold text-white mb-4"
                        style={{ backgroundColor: getAvatarColor(profile.userId) }}
                    >
                        {getInitials(profile.userId)}
                    </div>

                    {/* User Info */}
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-white mb-2">
                            User {profile.userId.substring(0, 8)}
                        </h2>
                        {profile.headline && (
                            <p className="text-lg text-gray-300 mb-3">{profile.headline}</p>
                        )}

                        {/* Connection Status Badge */}
                        <div className="mb-4">
                            {connectionStatus === 'accepted' && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-600 text-white">
                                    ✓ Connected
                                </span>
                            )}
                            {connectionStatus === 'pending_sent' && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-yellow-600 text-white">
                                    ⏳ Request Pending
                                </span>
                            )}
                            {connectionStatus === 'pending_received' && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-600 text-white">
                                    📬 Incoming Request
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Bio */}
                    {profile.bio && (
                        <div className="mb-6">
                            <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">
                                About
                            </h3>
                            <p className="text-gray-300 whitespace-pre-wrap">{profile.bio}</p>
                        </div>
                    )}

                    {/* Skills */}
                    {profile.skills && profile.skills.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-sm font-semibold text-gray-400 uppercase mb-3">
                                Skills
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {profile.skills.map((skill, index) => (
                                    <span
                                        key={index}
                                        className="px-3 py-1 bg-blue-600 bg-opacity-20 text-blue-300 rounded-full text-sm font-medium border border-blue-600"
                                    >
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Links */}
                    {profile.links && profile.links.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-sm font-semibold text-gray-400 uppercase mb-3">
                                Links
                            </h3>
                            <div className="space-y-2">
                                {profile.links.map((link, index) => (
                                    <a
                                        key={index}
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center text-blue-400 hover:text-blue-300 transition"
                                    >
                                        <svg
                                            className="w-4 h-4 mr-2"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                            />
                                        </svg>
                                        {link.label}
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 mt-6">
                        {connectionStatus === 'none' && onConnectClick && (
                            <button
                                onClick={onConnectClick}
                                disabled={isLoading}
                                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition"
                            >
                                {isLoading ? 'Connecting...' : '🤝 Connect'}
                            </button>
                        )}

                        {connectionStatus === 'pending_received' && (
                            <>
                                {onAcceptClick && (
                                    <button
                                        onClick={onAcceptClick}
                                        disabled={isLoading}
                                        className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition"
                                    >
                                        {isLoading ? 'Accepting...' : '✓ Accept'}
                                    </button>
                                )}
                                {onRejectClick && (
                                    <button
                                        onClick={onRejectClick}
                                        disabled={isLoading}
                                        className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition"
                                    >
                                        {isLoading ? 'Rejecting...' : '✗ Reject'}
                                    </button>
                                )}
                            </>
                        )}
                    </div>

                    {/* Admin Controls */}
                    {isAdmin && (
                        <div className="mt-6 pt-6 border-t border-gray-700">
                            <h3 className="text-sm font-semibold text-gray-400 uppercase mb-3">
                                Admin Controls
                            </h3>
                            <div className="grid grid-cols-3 gap-3">
                                {onMute && (
                                    <button
                                        onClick={onMute}
                                        className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold transition text-sm"
                                    >
                                        🔇 Mute
                                    </button>
                                )}
                                {onKick && (
                                    <button
                                        onClick={onKick}
                                        className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition text-sm"
                                    >
                                        👢 Kick
                                    </button>
                                )}
                                {onBlock && (
                                    <button
                                        onClick={onBlock}
                                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition text-sm"
                                    >
                                        🚫 Block
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfileModal;

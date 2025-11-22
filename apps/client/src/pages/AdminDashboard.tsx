import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    getAllUsers,
    changeUserRole,
    muteUser,
    unmuteUser,
    kickUserFromRoom,
    getModerationLogs,
} from '../api/adminApi';
import type { UserRole, ModerationLog } from '@metaverse/shared';

interface User {
    _id: string;
    username: string;
    email: string;
    role: UserRole;
    isMuted?: boolean;
    bannedRooms?: string[];
}

/**
 * AdminDashboard Component
 * Main admin and moderator dashboard for user and room management
 */
const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'users' | 'logs'>('users');
    const [users, setUsers] = useState<User[]>([]);
    const [logs, setLogs] = useState<ModerationLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Get current user role from localStorage
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const userRole = currentUser.role as UserRole;

    // Check if user has access
    useEffect(() => {
        if (userRole !== 'admin' && userRole !== 'moderator') {
            navigate('/rooms');
        }
    }, [userRole, navigate]);

    // Load users
    useEffect(() => {
        const loadUsers = async () => {
            try {
                setLoading(true);
                const response = await getAllUsers();
                if (response.success) {
                    setUsers(response.data);
                }
            } catch (err: any) {
                setError('Failed to load users');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (activeTab === 'users') {
            loadUsers();
        }
    }, [activeTab]);

    // Load logs
    useEffect(() => {
        const loadLogs = async () => {
            try {
                setLoading(true);
                const response = await getModerationLogs();
                if (response.success) {
                    setLogs(response.data);
                }
            } catch (err: any) {
                setError('Failed to load logs');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (activeTab === 'logs' && userRole === 'admin') {
            loadLogs();
        }
    }, [activeTab, userRole]);

    const handleRoleChange = async (userId: string, newRole: UserRole) => {
        try {
            await changeUserRole(userId, newRole);
            // Reload users
            const response = await getAllUsers();
            if (response.success) {
                setUsers(response.data);
            }
        } catch (err) {
            console.error('Error changing role:', err);
            alert('Failed to change user role');
        }
    };

    const handleMute = async (userId: string) => {
        try {
            await muteUser(userId);
            const response = await getAllUsers();
            if (response.success) {
                setUsers(response.data);
            }
        } catch (err) {
            console.error('Error muting user:', err);
            alert('Failed to mute user');
        }
    };

    const handleUnmute = async (userId: string) => {
        try {
            await unmuteUser(userId);
            const response = await getAllUsers();
            if (response.success) {
                setUsers(response.data);
            }
        } catch (err) {
            console.error('Error unmuting user:', err);
            alert('Failed to unmute user');
        }
    };

    const handleKick = async (userId: string) => {
        const roomId = prompt('Enter room ID to ban user from:');
        if (!roomId) return;

        const reason = prompt('Reason (optional):');

        try {
            await kickUserFromRoom(userId, roomId, reason || undefined);
            alert('User banned from room successfully');
        } catch (err) {
            console.error('Error kicking user:', err);
            alert('Failed to kick user');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-white text-xl">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
                    <p className="text-gray-400">
                        Role: <span className="text-yellow-400 font-semibold">{userRole}</span>
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mb-6 border-b border-gray-700">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`pb-2 px-4 border-b-2 transition-colors ${activeTab === 'users'
                                ? 'border-blue-500 text-blue-400'
                                : 'border-transparent text-gray-400 hover:text-white'
                            }`}
                    >
                        Users Management
                    </button>
                    {userRole === 'admin' && (
                        <button
                            onClick={() => setActiveTab('logs')}
                            className={`pb-2 px-4 border-b-2 transition-colors ${activeTab === 'logs'
                                    ? 'border-blue-500 text-blue-400'
                                    : 'border-transparent text-gray-400 hover:text-white'
                                }`}
                        >
                            Moderation Logs
                        </button>
                    )}
                </div>

                {error && (
                    <div className="bg-red-500/20 border border-red-500 text-red-400 p-4 rounded mb-6">
                        {error}
                    </div>
                )}

                {/* Users Tab */}
                {activeTab === 'users' && (
                    <div className="bg-gray-800 rounded-lg overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-700">
                                <tr>
                                    <th className="text-left p-4">Username</th>
                                    <th className="text-left p-4">Email</th>
                                    <th className="text-left p-4">Role</th>
                                    <th className="text-left p-4">Status</th>
                                    <th className="text-left p-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user._id} className="border-t border-gray-700">
                                        <td className="p-4">{user.username}</td>
                                        <td className="p-4">{user.email}</td>
                                        <td className="p-4">
                                            {userRole === 'admin' ? (
                                                <select
                                                    value={user.role}
                                                    onChange={(e) =>
                                                        handleRoleChange(
                                                            user._id,
                                                            e.target.value as UserRole
                                                        )
                                                    }
                                                    className="bg-gray-700 border border-gray-600 rounded px-2 py-1"
                                                >
                                                    <option value="user">User</option>
                                                    <option value="moderator">Moderator</option>
                                                    <option value="admin">Admin</option>
                                                </select>
                                            ) : (
                                                <span className="px-2 py-1 bg-gray-700 rounded">
                                                    {user.role}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            {user.isMuted ? (
                                                <span className="text-red-400">🔇 Muted</span>
                                            ) : (
                                                <span className="text-green-400">Active</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex gap-2">
                                                {user.isMuted ? (
                                                    <button
                                                        onClick={() => handleUnmute(user._id)}
                                                        className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm"
                                                    >
                                                        Unmute
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleMute(user._id)}
                                                        className="bg-yellow-600 hover:bg-yellow-700 px-3 py-1 rounded text-sm"
                                                    >
                                                        Mute
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleKick(user._id)}
                                                    className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
                                                >
                                                    Kick
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Logs Tab */}
                {activeTab === 'logs' && userRole === 'admin' && (
                    <div className="bg-gray-800 rounded-lg p-6">
                        <h2 className="text-2xl font-bold mb-4">Moderation Logs</h2>
                        <div className="space-y-3">
                            {logs.map((log) => (
                                <div
                                    key={log._id}
                                    className="bg-gray-700 p-4 rounded-lg flex justify-between items-start"
                                >
                                    <div>
                                        <div className="font-semibold text-lg mb-1">
                                            {log.action}
                                        </div>
                                        <div className="text-sm text-gray-400">
                                            Target: {log.targetUserId || 'N/A'} | Issued by:{' '}
                                            {log.issuedByUserId}
                                        </div>
                                        {log.reason && (
                                            <div className="text-sm text-gray-300 mt-1">
                                                Reason: {log.reason}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        {new Date(log.createdAt).toLocaleString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;

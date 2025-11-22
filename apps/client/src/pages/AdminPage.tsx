import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { RoomDTO, ApiResponse } from '@metaverse/shared';

const AdminPage = () => {
    const { user, token, logout } = useAuth();
    const navigate = useNavigate();
    const [rooms, setRooms] = useState<RoomDTO[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [roomName, setRoomName] = useState('');
    const [roomSlug, setRoomSlug] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);

    useEffect(() => {
        if (!user || user.role !== 'admin') {
            navigate('/lobby');
            return;
        }

        fetchRooms();
    }, [user, navigate]);

    const fetchRooms = async () => {
        try {
            const response = await fetch('/api/rooms', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data: ApiResponse<{ rooms: RoomDTO[] }> = await response.json();
            if (data.success && data.data) {
                setRooms(data.data.rooms);
            }
        } catch (error) {
            console.error('Failed to fetch rooms:', error);
        }
    };

    const handleCreateRoom = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const response = await fetch('/api/rooms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name: roomName,
                    slug: roomSlug,
                    isPrivate,
                    layoutJson: {},
                }),
            });

            if (response.ok) {
                setShowCreateModal(false);
                setRoomName('');
                setRoomSlug('');
                setIsPrivate(false);
                fetchRooms();
            }
        } catch (error) {
            console.error('Failed to create room:', error);
        }
    };

    const handleDeleteRoom = async (roomId: string) => {
        if (!confirm('Are you sure you want to delete this room?')) return;

        try {
            const response = await fetch(`/api/rooms/${roomId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                fetchRooms();
            }
        } catch (error) {
            console.error('Failed to delete room:', error);
        }
    };

    if (!user || user.role !== 'admin') return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
            {/* Header */}
            <div className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
                        <p className="text-gray-400">Manage rooms and users</p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={() => navigate('/lobby')}
                            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition"
                        >
                            Back to Lobby
                        </button>
                        <button
                            onClick={logout}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-white">All Rooms</h2>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition"
                    >
                        + Create Room
                    </button>
                </div>

                {/* Room List */}
                <div className="grid grid-cols-1 gap-4">
                    {rooms.map((room) => (
                        <div
                            key={room._id}
                            className="bg-gray-800 rounded-xl p-6 flex justify-between items-center border-2 border-gray-700"
                        >
                            <div>
                                <h3 className="text-xl font-bold text-white">{room.name}</h3>
                                <p className="text-gray-400">/{room.slug}</p>
                                <span
                                    className={`inline-block mt-2 px-3 py-1 rounded-full text-xs ${room.isPublic
                                            ? 'bg-green-500/20 text-green-300'
                                            : 'bg-green-500/20 text-green-300'
                                        }`}
                                >
                                    {room.isPublic ? 'Public' : 'Public'}
                                </span>
                            </div>
                            <button
                                onClick={() => handleDeleteRoom(room._id)}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                            >
                                Delete
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Create Room Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full">
                        <h2 className="text-2xl font-bold text-white mb-6">Create New Room</h2>
                        <form onSubmit={handleCreateRoom} className="space-y-4">
                            <div>
                                <label className="block text-gray-300 mb-2">Room Name</label>
                                <input
                                    type="text"
                                    value={roomName}
                                    onChange={(e) => setRoomName(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-gray-300 mb-2">Room Slug</label>
                                <input
                                    type="text"
                                    value={roomSlug}
                                    onChange={(e) => setRoomSlug(e.target.value)}
                                    placeholder="main-lobby"
                                    className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    required
                                />
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="isPrivate"
                                    checked={isPrivate}
                                    onChange={(e) => setIsPrivate(e.target.checked)}
                                    className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                                />
                                <label htmlFor="isPrivate" className="ml-2 text-gray-300">
                                    Private Room
                                </label>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
                                >
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPage;

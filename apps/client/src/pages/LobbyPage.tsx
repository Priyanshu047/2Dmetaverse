import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { RoomDTO, ApiResponse } from '@metaverse/shared';

const LobbyPage = () => {
    const { user, logout } = useAuth();
    const [rooms, setRooms] = useState<RoomDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        fetchRooms();
    }, [user, navigate]);

    const fetchRooms = async () => {
        try {
            const response = await fetch('/api/rooms');
            const data: ApiResponse<{ rooms: RoomDTO[] }> = await response.json();
            if (data.success && data.data) {
                setRooms(data.data.rooms);
            }
        } catch (error) {
            console.error('Failed to fetch rooms:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleJoinRoom = (roomId: string) => {
        navigate(`/room/${roomId}`);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
            {/* Header */}
            <div className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-white">2D Metaverse</h1>
                        <p className="text-gray-400">Welcome, {user?.username}!</p>
                    </div>
                    <div className="flex gap-4">
                        {user?.role === 'admin' && (
                            <button
                                onClick={() => navigate('/admin')}
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
                            >
                                Admin Panel
                            </button>
                        )}
                        <button
                            onClick={logout}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            {/* Room List */}
            <div className="container mx-auto px-4 py-8">
                <h2 className="text-3xl font-bold text-white mb-6">Available Rooms</h2>

                {loading ? (
                    <div className="text-white text-center py-12">Loading rooms...</div>
                ) : rooms.length === 0 ? (
                    <div className="text-gray-400 text-center py-12">No rooms available</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {rooms.map((room) => (
                            <div
                                key={room._id}
                                className="bg-gray-800 rounded-xl p-6 hover:bg-gray-750 transition cursor-pointer border-2 border-gray-700 hover:border-blue-500"
                                onClick={() => handleJoinRoom(room._id)}
                            >
                                <h3 className="text-xl font-bold text-white mb-2">{room.name}</h3>
                                <p className="text-gray-400 text-sm mb-4">/{room.slug}</p>
                                <div className="flex items-center justify-between">
                                    <span
                                        className={`px-3 py-1 rounded-full text-xs ${!room.isPublic
                                            ? 'bg-red-500/20 text-red-300'
                                            : 'bg-green-500/20 text-green-300'
                                            }`}
                                    >
                                        {!room.isPublic ? 'Private' : 'Public'}
                                    </span>
                                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition">
                                        Join Room
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LobbyPage;

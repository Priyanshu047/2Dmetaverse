import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRoom } from '../../api/rooms';

interface CreateRoomModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const CreateRoomModal: React.FC<CreateRoomModalProps> = ({ isOpen, onClose }) => {
    const [roomName, setRoomName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!roomName.trim()) return;

        setIsLoading(true);
        setError('');

        try {
            const room = await createRoom(roomName);
            onClose();
            // Redirect to the new room using its slug
            navigate(`/rooms/${room.slug}`);
        } catch (err) {
            console.error('Failed to create room:', err);
            setError('Failed to create room. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
            <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md border border-gray-700">
                <div className="p-6">
                    <h2 className="text-2xl font-bold text-white mb-4">Create New Room</h2>

                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block text-gray-300 text-sm font-bold mb-2">
                                Room Name
                            </label>
                            <input
                                type="text"
                                value={roomName}
                                onChange={(e) => setRoomName(e.target.value)}
                                placeholder="e.g. Chill Lounge"
                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                                autoFocus
                            />
                        </div>

                        {error && (
                            <p className="text-red-400 text-sm mb-4">{error}</p>
                        )}

                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-gray-300 hover:text-white transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading || !roomName.trim()}
                                className={`px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold transition ${isLoading || !roomName.trim()
                                        ? 'opacity-50 cursor-not-allowed'
                                        : 'hover:bg-blue-700'
                                    }`}
                            >
                                {isLoading ? 'Creating...' : 'Create Room'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateRoomModal;

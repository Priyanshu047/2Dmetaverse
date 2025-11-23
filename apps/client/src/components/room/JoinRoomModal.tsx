import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface JoinRoomModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const JoinRoomModal: React.FC<JoinRoomModalProps> = ({ isOpen, onClose }) => {
    const [roomId, setRoomId] = useState('');
    const navigate = useNavigate();

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!roomId.trim()) return;

        // Redirect to the room using the 6-digit code
        // The backend getRoom controller now handles 6-digit codes
        onClose();
        navigate(`/rooms/${roomId.toUpperCase()}`);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
            <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md border border-gray-700">
                <div className="p-6">
                    <h2 className="text-2xl font-bold text-white mb-4">Join Room</h2>

                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block text-gray-300 text-sm font-bold mb-2">
                                Room ID (6-Digit Code)
                            </label>
                            <input
                                type="text"
                                value={roomId}
                                onChange={(e) => setRoomId(e.target.value)}
                                placeholder="e.g. A7X92B"
                                maxLength={6}
                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 uppercase tracking-widest text-center text-xl"
                                autoFocus
                            />
                        </div>

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
                                disabled={!roomId.trim()}
                                className={`px-6 py-2 bg-green-600 text-white rounded-lg font-semibold transition ${!roomId.trim()
                                        ? 'opacity-50 cursor-not-allowed'
                                        : 'hover:bg-green-700'
                                    }`}
                            >
                                Join Room
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default JoinRoomModal;

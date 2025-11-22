import React, { useState, useEffect, useCallback } from 'react';
import { Room } from 'livekit-client';
import { LiveKitRoom, VideoTrack, AudioTrack } from '@livekit/components-react';
import '@livekit/components-styles';
import { startPresenting, stopPresenting, getStageToken } from '../api/stageApi';
import type { LiveKitTokenResponse } from '@metaverse/shared';

interface PresenterControlsProps {
    roomId: string;
    userId: string;
    username: string;
    isLive: boolean;
}

/**
 * PresenterControls Component
 * Controls for the stage presenter including video preview and broadcast controls
 */
const PresenterControls: React.FC<PresenterControlsProps> = ({
    roomId,
    userId,
    username,
    isLive: initialIsLive,
}) => {
    const [isLive, setIsLive] = useState(initialIsLive);
    const [livekitToken, setLivekitToken] = useState<LiveKitTokenResponse | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>('');

    // Update local isLive state when prop changes
    useEffect(() => {
        setIsLive(initialIsLive);
    }, [initialIsLive]);

    /**
     * Start broadcasting
     */
    const handleStartBroadcast = async () => {
        setLoading(true);
        setError('');

        try {
            // Start presentation session on backend
            await startPresenting(roomId, userId);

            // Get LiveKit token
            const tokenResponse = await getStageToken(
                roomId,
                userId,
                'presenter',
                username
            );

            if (tokenResponse.success) {
                setLivekitToken(tokenResponse.data);
                setIsLive(true);
            }
        } catch (err: any) {
            console.error('Error starting broadcast:', err);
            setError(err.response?.data?.message || 'Failed to start broadcast');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Stop broadcasting
     */
    const handleStopBroadcast = async () => {
        setLoading(true);
        setError('');

        try {
            await stopPresenting(roomId, userId);
            setLivekitToken(null);
            setIsLive(false);
        } catch (err: any) {
            console.error('Error stopping broadcast:', err);
            setError(err.response?.data?.message || 'Failed to stop broadcast');
        } finally {
            setLoading(false);
        }
    };

    if (!isLive) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <div className="bg-gray-800 p-8 rounded-lg shadow-lg text-center max-w-md">
                    <h2 className="text-2xl font-bold mb-4">Presenter Controls</h2>
                    <p className="text-gray-400 mb-6">
                        You're ready to present. Click the button below to start broadcasting.
                    </p>

                    {error && (
                        <div className="bg-red-500/20 border border-red-500 text-red-400 p-3 rounded mb-4">
                            {error}
                        </div>
                    )}

                    <button
                        onClick={handleStartBroadcast}
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold py-3 px-8 rounded-lg transition-colors"
                    >
                        {loading ? 'Starting...' : 'Start Broadcast'}
                    </button>
                </div>
            </div>
        );
    }

    if (!livekitToken) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-gray-400">Connecting to stage...</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* LiveKit Room */}
            <div className="flex-1 bg-black rounded-lg overflow-hidden relative">
                <LiveKitRoom
                    token={livekitToken.token}
                    serverUrl={livekitToken.url}
                    connect={true}
                    audio={!isMuted}
                    video={!isVideoOff}
                    className="h-full"
                >
                    <div className="flex items-center justify-center h-full">
                        {/* Your video preview */}
                        <div className="text-white text-2xl">
                            Your Video Preview
                        </div>
                    </div>
                </LiveKitRoom>

                {/* Live Indicator */}
                <div className="absolute top-4 left-4 bg-red-600 text-white px-4 py-2 rounded-full font-bold flex items-center gap-2">
                    <span className="w-3 h-3 bg-white rounded-full animate-pulse"></span>
                    LIVE
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4 mt-4">
                <button
                    onClick={() => setIsMuted(!isMuted)}
                    className={`p-4 rounded-full ${isMuted ? 'bg-red-600' : 'bg-gray-700'
                        } hover:opacity-80 transition-opacity`}
                    title={isMuted ? 'Unmute' : 'Mute'}
                >
                    {isMuted ? '🔇' : '🎤'}
                </button>

                <button
                    onClick={() => setIsVideoOff(!isVideoOff)}
                    className={`p-4 rounded-full ${isVideoOff ? 'bg-red-600' : 'bg-gray-700'
                        } hover:opacity-80 transition-opacity`}
                    title={isVideoOff ? 'Turn Video On' : 'Turn Video Off'}
                >
                    {isVideoOff ? '📹❌' : '📹'}
                </button>

                <button
                    onClick={handleStopBroadcast}
                    disabled={loading}
                    className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                >
                    {loading ? 'Stopping...' : 'Stop Broadcast'}
                </button>
            </div>

            {error && (
                <div className="bg-red-500/20 border border-red-500 text-red-400 p-3 rounded mt-4">
                    {error}
                </div>
            )}
        </div>
    );
};

export default PresenterControls;

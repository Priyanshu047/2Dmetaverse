import React, { useState, useEffect } from 'react';
import { LiveKitRoom } from '@livekit/components-react';
import '@livekit/components-styles';
import { getStageToken } from '../api/stageApi';
import type { LiveKitTokenResponse } from '@metaverse/shared';

interface AudienceViewProps {
    roomId: string;
    userId: string;
    username: string;
    isLive: boolean;
    presenterId: string | null;
}

/**
 * AudienceView Component
 * View for audience members watching the presenter's stream
 */
const AudienceView: React.FC<AudienceViewProps> = ({
    roomId,
    userId,
    username,
    isLive,
    presenterId,
}) => {
    const [livekitToken, setLivekitToken] = useState<LiveKitTokenResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>('');

    // Get LiveKit token when stage goes live
    useEffect(() => {
        const connectToStage = async () => {
            if (!isLive) {
                setLivekitToken(null);
                return;
            }

            setLoading(true);
            setError('');

            try {
                const tokenResponse = await getStageToken(
                    roomId,
                    userId,
                    'audience',
                    username
                );

                if (tokenResponse.success) {
                    setLivekitToken(tokenResponse.data);
                }
            } catch (err: any) {
                console.error('Error getting stage token:', err);
                setError(err.response?.data?.message || 'Failed to connect to stage');
            } finally {
                setLoading(false);
            }
        };

        connectToStage();
    }, [isLive, roomId, userId, username]);

    if (!isLive) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="text-6xl mb-4">🎭</div>
                    <h3 className="text-2xl font-bold mb-2">Waiting for Presenter</h3>
                    <p className="text-gray-400">
                        The stage is currently offline. Please wait for the presenter to start.
                    </p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-gray-400 text-xl">Connecting to stage...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="bg-red-500/20 border border-red-500 text-red-400 p-6 rounded-lg max-w-md">
                    <h3 className="font-bold mb-2">Connection Error</h3>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    if (!livekitToken) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-gray-400">Loading stream...</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Main Video */}
            <div className="flex-1 bg-black rounded-lg overflow-hidden relative">
                <LiveKitRoom
                    token={livekitToken.token}
                    serverUrl={livekitToken.url}
                    connect={true}
                    audio={true}
                    video={false}
                    className="h-full"
                >
                    <div className="flex items-center justify-center h-full">
                        {/* Presenter's video stream */}
                        <div className="text-white text-2xl">
                            Presenter Video Stream
                        </div>
                    </div>
                </LiveKitRoom>

                {/* Live Indicator */}
                <div className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-full font-bold flex items-center gap-2">
                    <span className="w-3 h-3 bg-white rounded-full animate-pulse"></span>
                    LIVE
                </div>

                {/* Presenter Info */}
                {presenterId && (
                    <div className="absolute bottom-4 left-4 bg-black/70 text-white px-4 py-2 rounded-lg">
                        <div className="text-sm text-gray-300">Presenter</div>
                        <div className="font-bold">User {presenterId.substring(0, 8)}</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AudienceView;

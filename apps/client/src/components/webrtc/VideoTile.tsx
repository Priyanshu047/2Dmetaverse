import { useEffect, useRef, useState } from 'react';

interface VideoTileProps {
    stream: MediaStream | null;
    peerId: string;
    isMuted?: boolean;
    isLocal?: boolean;
}

const VideoTile: React.FC<VideoTileProps> = ({ stream, peerId, isMuted = false, isLocal = false }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }

        // Audio for remote peers - with proper autoplay handling
        if (!isLocal && audioRef.current && stream) {
            audioRef.current.srcObject = stream;

            // Ensure volume is set
            audioRef.current.volume = 1.0;

            // Try to play (may be blocked by browser)
            audioRef.current.play().catch(err => {
                console.log('Audio autoplay blocked, waiting for user interaction:', err);
            });
        }
    }, [stream, isLocal, peerId]);

    // Check video track status periodically
    useEffect(() => {
        if (!stream) return;

        const checkVideoStatus = () => {
            const videoTrack = stream.getVideoTracks()[0];
            const isEnabled = videoTrack ? videoTrack.enabled : false;
            setIsVideoEnabled(isEnabled);
        };

        // Check immediately
        checkVideoStatus();

        // Check every 500ms (since track.enabled changes don't trigger re-renders)
        const interval = setInterval(checkVideoStatus, 500);

        // Also listen for 'mute'/'unmute' events on the track
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.onmute = () => setIsVideoEnabled(false);
            videoTrack.onunmute = () => setIsVideoEnabled(true);
        }

        return () => {
            clearInterval(interval);
        };
    }, [stream]);

    return (
        <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video border-2 border-gray-700">
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={true} // Always mute video element to prevent echo
                className={`w-full h-full object-cover ${!isVideoEnabled ? 'hidden' : ''}`}
            />

            {/* Audio element for remote peers */}
            {!isLocal && (
                <audio
                    ref={audioRef}
                    autoPlay
                    playsInline
                    muted={false}
                    className="hidden"
                />
            )}

            {/* Camera Off / No Video State */}
            {(!stream || !isVideoEnabled) && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                    <div className="text-gray-400 text-center">
                        <div className="text-4xl mb-2">
                            {!stream ? '🔌' : '📷'}
                        </div>
                        <div className="text-sm">
                            {!stream ? 'No Connection' : 'Camera Off'}
                        </div>
                    </div>
                </div>
            )}

            {/* Peer ID Label */}
            <div className="absolute bottom-2 left-2 bg-black/70 px-3 py-1 rounded-full">
                <span className="text-white text-xs font-medium">
                    {isLocal ? '👤 You' : `👤 ${peerId.substring(0, 8)}`}
                </span>
            </div>

            {/* Muted Indicator */}
            {isMuted && !isLocal && (
                <div className="absolute top-2 right-2 bg-red-600 px-2 py-1 rounded-full">
                    <span className="text-white text-xs">🔇</span>
                </div>
            )}
        </div>
    );
};

export default VideoTile;

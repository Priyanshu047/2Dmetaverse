import { useEffect, useRef } from 'react';

interface VideoTileProps {
    stream: MediaStream | null;
    peerId: string;
    isMuted?: boolean;
    isLocal?: boolean;
}

const VideoTile: React.FC<VideoTileProps> = ({ stream, peerId, isMuted = false, isLocal = false }) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    return (
        <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video border-2 border-gray-700">
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={true} // Always mute to prevent double audio (spatial audio handled separately)
                className="w-full h-full object-cover"
            />

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

            {/* No Stream Indicator */}
            {!stream && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                    <div className="text-gray-400 text-center">
                        <div className="text-4xl mb-2">📹</div>
                        <div className="text-sm">No video</div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VideoTile;

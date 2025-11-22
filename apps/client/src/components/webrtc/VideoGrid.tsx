import VideoTile from './VideoTile';

interface Peer {
    stream: MediaStream | null;
}

interface VideoGridProps {
    localStream: MediaStream | null;
    peers: Map<string, Peer>;
    localPeerId: string;
}

const VideoGrid: React.FC<VideoGridProps> = ({ localStream, peers, localPeerId }) => {
    // Convert peers map to array and sort by peerId for consistent ordering
    const peerArray = Array.from(peers.entries()).sort((a, b) => a[0].localeCompare(b[0]));

    return (
        <div className="p-4 space-y-3 overflow-y-auto max-h-[500px]">
            <h3 className="text-white font-semibold text-sm mb-2">
                Video ({1 + peerArray.length} {peerArray.length === 0 ? 'participant' : 'participants'})
            </h3>

            {/* Local Video */}
            <VideoTile stream={localStream} peerId={localPeerId} isLocal={true} />

            {/* Remote Videos */}
            {peerArray.map(([peerId, peerData]) => (
                <VideoTile key={peerId} stream={peerData.stream} peerId={peerId} isLocal={false} />
            ))}

            {/* Empty State */}
            {peerArray.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                    <div className="text-3xl mb-2">👥</div>
                    <div className="text-sm">Waiting for others to join...</div>
                </div>
            )}
        </div>
    );
};

export default VideoGrid;

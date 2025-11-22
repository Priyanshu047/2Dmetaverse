import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import { getStageState, getQuestions } from '../api/stageApi';
import type { Question } from '@metaverse/shared';
import PresenterControls from '../components/PresenterControls';
import AudienceView from '../components/AudienceView';
import QnAPanel from '../components/QnAPanel';

interface StageState {
    presenterId: string | null;
    isLive: boolean;
    sessionId: string | null;
}

/**
 * StageRoomPage Component
 * Main page component for virtual stage / conference room
 * Renders different UI based on user role (presenter vs audience)
 */
const StageRoomPage: React.FC = () => {
    const { roomId } = useParams<{ roomId: string }>();
    const { socket } = useSocket();
    const [stageState, setStageState] = useState<StageState>({
        presenterId: null,
        isLive: false,
        sessionId: null,
    });
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);

    // Get current user (from localStorage or context)
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = currentUser.id || '';
    const username = currentUser.username || 'User';

    // Determine if current user is the presenter
    const isPresenter = stageState.presenterId === userId;

    // Fetch initial stage state
    useEffect(() => {
        const fetchStageState = async () => {
            try {
                if (!roomId) return;
                const response = await getStageState(roomId);
                if (response.success) {
                    setStageState(response.data);
                }
            } catch (error) {
                console.error('Error fetching stage state:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStageState();
    }, [roomId]);

    // Fetch questions when stage goes live
    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                if (!roomId || !stageState.isLive) return;
                const response = await getQuestions(roomId);
                if (response.success) {
                    setQuestions(response.data);
                }
            } catch (error) {
                console.error('Error fetching questions:', error);
            }
        };

        if (stageState.isLive) {
            fetchQuestions();
        }
    }, [roomId, stageState.isLive]);

    // Listen for stage events via Socket.io
    useEffect(() => {
        if (!socket || !roomId) return;

        // Handler for presenter started
        const handlePresenterStarted = (data: any) => {
            setStageState({
                presenterId: data.presenterId,
                isLive: true,
                sessionId: data.sessionId,
            });
        };

        // Handler for presenter stopped
        const handlePresenterStopped = () => {
            setStageState({
                presenterId: null,
                isLive: false,
                sessionId: null,
            });
        };

        // Handler for new question
        const handleQuestionAdded = (data: { question: Question }) => {
            setQuestions((prev) => [data.question, ...prev]);
        };

        socket.on('stage:presenter-started', handlePresenterStarted);
        socket.on('stage:presenter-stopped', handlePresenterStopped);
        socket.on('stage:question-added', handleQuestionAdded);

        return () => {
            socket.off('stage:presenter-started', handlePresenterStarted);
            socket.off('stage:presenter-stopped', handlePresenterStopped);
            socket.off('stage:question-added', handleQuestionAdded);
        };
    }, [socket, roomId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-900">
                <div className="text-white text-xl">Loading stage...</div>
            </div>
        );
    }

    if (!roomId) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-900">
                <div className="text-white text-xl">Room ID not found</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-gray-900 text-white">
            {/* Header */}
            <div className="bg-gray-800 p-4 border-b border-gray-700">
                <h1 className="text-2xl font-bold">Virtual Stage</h1>
                <p className="text-gray-400 text-sm">
                    {stageState.isLive ? (
                        <span className="text-green-400">● LIVE</span>
                    ) : (
                        <span className="text-gray-500">○ Not Live</span>
                    )}
                </p>
            </div>

            {/* Main Content */}
            <div className="flex flex-1 overflow-hidden">
                {/* Video Area */}
                <div className="flex-1 p-4">
                    {isPresenter ? (
                        <PresenterControls
                            roomId={roomId}
                            userId={userId}
                            username={username}
                            isLive={stageState.isLive}
                        />
                    ) : (
                        <AudienceView
                            roomId={roomId}
                            userId={userId}
                            username={username}
                            isLive={stageState.isLive}
                            presenterId={stageState.presenterId}
                        />
                    )}
                </div>

                {/* Q&A Sidebar */}
                <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
                    <QnAPanel
                        roomId={roomId}
                        userId={userId}
                        username={username}
                        questions={questions}
                        isPresenter={isPresenter}
                    />
                </div>
            </div>
        </div>
    );
};

export default StageRoomPage;

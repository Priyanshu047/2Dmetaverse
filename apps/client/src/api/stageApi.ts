import axios from 'axios';
import type {
    StageSession,
    Question,
    LiveKitTokenResponse,
    StageUserRole,
} from '@metaverse/shared';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * Stage API Client
 * Handles all HTTP requests related to virtual stage / conference room features
 */

// Get authentication token from localStorage
const getAuthToken = (): string => {
    return localStorage.getItem('token') || '';
};

/**
 * Start presenting in a stage room
 */
export const startPresenting = async (
    roomId: string,
    userId: string
): Promise<{ success: boolean; data?: any; message?: string }> => {
    const response = await axios.post(
        `${API_URL}/stage/${roomId}/presenter/start`,
        { userId },
        {
            headers: {
                Authorization: `Bearer ${getAuthToken()}`,
            },
        }
    );
    return response.data;
};

/**
 * Stop presenting in a stage room
 */
export const stopPresenting = async (
    roomId: string,
    userId: string
): Promise<{ success: boolean; message?: string }> => {
    const response = await axios.post(
        `${API_URL}/stage/${roomId}/presenter/stop`,
        { userId },
        {
            headers: {
                Authorization: `Bearer ${getAuthToken()}`,
            },
        }
    );
    return response.data;
};

/**
 * Get current stage state
 */
export const getStageState = async (
    roomId: string
): Promise<{
    success: boolean;
    data: {
        roomId: string;
        presenterId: string | null;
        isLive: boolean;
        sessionId: string | null;
    };
}> => {
    const response = await axios.get(`${API_URL}/stage/${roomId}/state`, {
        headers: {
            Authorization: `Bearer ${getAuthToken()}`,
        },
    });
    return response.data;
};

/**
 * Request LiveKit access token
 */
export const getStageToken = async (
    roomId: string,
    userId: string,
    role: StageUserRole,
    username?: string
): Promise<{ success: boolean; data: LiveKitTokenResponse }> => {
    const response = await axios.post(
        `${API_URL}/stage/${roomId}/token`,
        { userId, role, username },
        {
            headers: {
                Authorization: `Bearer ${getAuthToken()}`,
            },
        }
    );
    return response.data;
};

/**
 * Submit a Q&A question
 */
export const submitQuestion = async (
    roomId: string,
    userId: string,
    username: string,
    questionText: string
): Promise<{ success: boolean; data: Question; message?: string }> => {
    const response = await axios.post(
        `${API_URL}/stage/${roomId}/questions`,
        { userId, username, questionText },
        {
            headers: {
                Authorization: `Bearer ${getAuthToken()}`,
            },
        }
    );
    return response.data;
};

/**
 * Get Q&A questions for a stage session
 */
export const getQuestions = async (
    roomId: string
): Promise<{ success: boolean; data: Question[] }> => {
    const response = await axios.get(`${API_URL}/stage/${roomId}/questions`, {
        headers: {
            Authorization: `Bearer ${getAuthToken()}`,
        },
    });
    return response.data;
};

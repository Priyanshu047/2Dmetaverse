import axios from 'axios';
import type { UserRole, ModerationLog } from '@metaverse/shared';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Get authentication token from localStorage
const getAuthToken = (): string => {
    return localStorage.getItem('token') || '';
};

/**
 * Admin API Client
 * Handles all HTTP requests for moderation and admin functions
 */

/**
 * Get all users
 */
export const getAllUsers = async (): Promise<{
    success: boolean;
    data: any[];
}> => {
    const response = await axios.get(`${API_URL}/admin/users`, {
        headers: {
            Authorization: `Bearer ${getAuthToken()}`,
        },
    });
    return response.data;
};

/**
 * Change user role
 */
export const changeUserRole = async (
    userId: string,
    role: UserRole
): Promise<{ success: boolean; message?: string }> => {
    const response = await axios.post(
        `${API_URL}/admin/users/${userId}/role`,
        { role },
        {
            headers: {
                Authorization: `Bearer ${getAuthToken()}`,
            },
        }
    );
    return response.data;
};

/**
 * Mute user
 */
export const muteUser = async (
    userId: string,
    roomId?: string,
    reason?: string
): Promise<{ success: boolean; message?: string }> => {
    const response = await axios.post(
        `${API_URL}/admin/users/${userId}/mute`,
        { roomId, reason },
        {
            headers: {
                Authorization: `Bearer ${getAuthToken()}`,
            },
        }
    );
    return response.data;
};

/**
 * Unmute user
 */
export const unmuteUser = async (
    userId: string,
    roomId?: string
): Promise<{ success: boolean; message?: string }> => {
    const response = await axios.post(
        `${API_URL}/admin/users/${userId}/unmute`,
        { roomId },
        {
            headers: {
                Authorization: `Bearer ${getAuthToken()}`,
            },
        }
    );
    return response.data;
};

/**
 * Kick user from room
 */
export const kickUserFromRoom = async (
    userId: string,
    roomId: string,
    reason?: string
): Promise<{ success: boolean; message?: string }> => {
    const response = await axios.post(
        `${API_URL}/admin/users/${userId}/kick`,
        { roomId, reason },
        {
            headers: {
                Authorization: `Bearer ${getAuthToken()}`,
            },
        }
    );
    return response.data;
};

/**
 * Lock room
 */
export const lockRoom = async (
    roomId: string
): Promise<{ success: boolean; message?: string }> => {
    const response = await axios.post(
        `${API_URL}/admin/rooms/${roomId}/lock`,
        {},
        {
            headers: {
                Authorization: `Bearer ${getAuthToken()}`,
            },
        }
    );
    return response.data;
};

/**
 * Unlock room
 */
export const unlockRoom = async (
    roomId: string
): Promise<{ success: boolean; message?: string }> => {
    const response = await axios.post(
        `${API_URL}/admin/rooms/${roomId}/unlock`,
        {},
        {
            headers: {
                Authorization: `Bearer ${getAuthToken()}`,
            },
        }
    );
    return response.data;
};

/**
 * Get moderation logs
 */
export const getModerationLogs = async (
    roomId?: string,
    userId?: string
): Promise<{
    success: boolean;
    data: ModerationLog[];
}> => {
    const params = new URLSearchParams();
    if (roomId) params.append('roomId', roomId);
    if (userId) params.append('userId', userId);

    const response = await axios.get(
        `${API_URL}/admin/moderation-logs?${params.toString()}`,
        {
            headers: {
                Authorization: `Bearer ${getAuthToken()}`,
            },
        }
    );
    return response.data;
};

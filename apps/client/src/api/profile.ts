import http from './http';
import { UserProfile, UpdateProfilePayload } from './types/networking';

/**
 * Get user profile by userId
 * @param userId - The ID of the user
 * @returns User profile data
 */
export const getProfile = async (userId: string): Promise<UserProfile> => {
    try {
        const response = await http.get(`/profile/${userId}`);
        return response.data.data;
    } catch (error) {
        console.error('Error fetching profile:', error);
        throw error;
    }
};

/**
 * Update current user's profile
 * @param payload - Profile data to update
 * @returns Updated profile data
 */
export const updateMyProfile = async (
    payload: UpdateProfilePayload
): Promise<UserProfile> => {
    try {
        const response = await http.put('/profile/me', payload);
        return response.data.data;
    } catch (error) {
        console.error('Error updating profile:', error);
        throw error;
    }
};

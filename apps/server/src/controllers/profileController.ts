import { Response } from 'express';
import { UserProfile } from '../models/UserProfile';
import { User } from '../models/User';
import { AuthenticatedRequest } from '../types';

/**
 * Get user profile by userId
 * GET /api/profile/:userId
 */
export const getProfile = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    try {
        const { userId } = req.params;

        // Verify user exists
        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found',
            });
            return;
        }

        // Find profile or return default
        let profile = await UserProfile.findOne({ userId });

        if (!profile) {
            // Return default profile structure for users without a profile
            res.status(200).json({
                success: true,
                data: {
                    userId,
                    headline: '',
                    skills: [],
                    links: [],
                    bio: '',
                },
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: profile,
        });
    } catch (error: any) {
        console.error('Error fetching profile:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch profile',
            error: error.message,
        });
    }
};

/**
 * Update current user's profile
 * PUT /api/profile/me
 */
export const updateMyProfile = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required',
            });
            return;
        }

        const { headline, skills, links, bio } = req.body;

        // Validate links if provided
        if (links && Array.isArray(links)) {
            for (const link of links) {
                if (!link.label || !link.url) {
                    res.status(400).json({
                        success: false,
                        message: 'Each link must have a label and url',
                    });
                    return;
                }

                // Validate URL format
                const urlPattern = /^https?:\/\/.+/;
                if (!urlPattern.test(link.url)) {
                    res.status(400).json({
                        success: false,
                        message: `Invalid URL format for link: ${link.label}`,
                    });
                    return;
                }
            }
        }

        // Upsert profile (update if exists, create if not)
        const profile = await UserProfile.findOneAndUpdate(
            { userId: req.user.id },
            {
                userId: req.user.id,
                ...(headline !== undefined && { headline }),
                ...(skills !== undefined && { skills }),
                ...(links !== undefined && { links }),
                ...(bio !== undefined && { bio }),
            },
            {
                new: true, // Return updated document
                upsert: true, // Create if doesn't exist
                runValidators: true, // Run schema validators
            }
        );

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: profile,
        });
    } catch (error: any) {
        console.error('Error updating profile:', error);

        // Handle validation errors
        if (error.name === 'ValidationError') {
            res.status(400).json({
                success: false,
                message: 'Validation error',
                error: error.message,
            });
            return;
        }

        res.status(500).json({
            success: false,
            message: 'Failed to update profile',
            error: error.message,
        });
    }
};

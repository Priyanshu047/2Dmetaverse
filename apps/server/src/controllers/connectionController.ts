import { Response } from 'express';
import { Connection } from '../models/Connection';
import { UserProfile } from '../models/UserProfile';
import { User } from '../models/User';
import { AuthenticatedRequest } from '../types';
import mongoose from 'mongoose';

/**
 * Send a connection request
 * POST /api/connections/request
 */
export const sendConnectionRequest = async (
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

        const { toUserId } = req.body;

        if (!toUserId) {
            res.status(400).json({
                success: false,
                message: 'toUserId is required',
            });
            return;
        }

        // Prevent self-connection
        if (req.user.id === toUserId) {
            res.status(400).json({
                success: false,
                message: 'Cannot send connection request to yourself',
            });
            return;
        }

        // Verify target user exists
        const targetUser = await User.findById(toUserId);
        if (!targetUser) {
            res.status(404).json({
                success: false,
                message: 'Target user not found',
            });
            return;
        }

        // Check for existing connection in either direction
        const existingConnection = await Connection.findOne({
            $or: [
                { fromUserId: req.user.id, toUserId: toUserId },
                { fromUserId: toUserId, toUserId: req.user.id },
            ],
        });

        if (existingConnection) {
            if (existingConnection.status === 'accepted') {
                res.status(400).json({
                    success: false,
                    message: 'Already connected with this user',
                });
                return;
            } else if (existingConnection.status === 'pending') {
                res.status(400).json({
                    success: false,
                    message: 'Connection request already pending',
                });
                return;
            } else if (existingConnection.status === 'rejected') {
                // Allow re-request after rejection by updating existing record
                existingConnection.status = 'pending';
                existingConnection.fromUserId = new mongoose.Types.ObjectId(req.user.id);
                existingConnection.toUserId = new mongoose.Types.ObjectId(toUserId);
                await existingConnection.save();

                res.status(200).json({
                    success: true,
                    message: 'Connection request sent',
                    data: existingConnection,
                });
                return;
            }
        }

        // Create new connection request
        const connection = await Connection.create({
            fromUserId: req.user.id,
            toUserId: toUserId,
            status: 'pending',
        });

        res.status(201).json({
            success: true,
            message: 'Connection request sent',
            data: connection,
        });
    } catch (error: any) {
        console.error('Error sending connection request:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send connection request',
            error: error.message,
        });
    }
};

/**
 * Respond to a connection request (accept or reject)
 * POST /api/connections/respond
 */
export const respondToConnection = async (
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

        const { requestId, action } = req.body;

        if (!requestId || !action) {
            res.status(400).json({
                success: false,
                message: 'requestId and action are required',
            });
            return;
        }

        if (action !== 'accept' && action !== 'reject') {
            res.status(400).json({
                success: false,
                message: 'action must be either "accept" or "reject"',
            });
            return;
        }

        // Find the connection request
        const connection = await Connection.findById(requestId);

        if (!connection) {
            res.status(404).json({
                success: false,
                message: 'Connection request not found',
            });
            return;
        }

        // Verify the current user is the recipient
        if (connection.toUserId.toString() !== req.user.id) {
            res.status(403).json({
                success: false,
                message: 'You can only respond to requests sent to you',
            });
            return;
        }

        // Check if already processed
        if (connection.status !== 'pending') {
            res.status(400).json({
                success: false,
                message: `Connection request already ${connection.status}`,
            });
            return;
        }

        // Update status
        connection.status = action === 'accept' ? 'accepted' : 'rejected';
        await connection.save();

        res.status(200).json({
            success: true,
            message: `Connection request ${action}ed`,
            data: connection,
        });
    } catch (error: any) {
        console.error('Error responding to connection:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to respond to connection request',
            error: error.message,
        });
    }
};

/**
 * Get connection list for current user
 * GET /api/connections/list
 */
export const listConnections = async (
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

        // Find all connections involving this user
        const connections = await Connection.find({
            $or: [{ fromUserId: req.user.id }, { toUserId: req.user.id }],
        }).populate('fromUserId toUserId', 'username email');

        // Categorize connections
        const accepted: any[] = [];
        const incoming: any[] = [];
        const outgoing: any[] = [];

        for (const conn of connections) {
            if (conn.status === 'accepted') {
                // For accepted connections, get the other user's ID
                const otherUserId =
                    conn.fromUserId.toString() === req.user.id
                        ? conn.toUserId
                        : conn.fromUserId;

                // Fetch their profile
                const profile = await UserProfile.findOne({
                    userId: otherUserId,
                });

                // Get user info
                const userInfo: any = conn.fromUserId.toString() === req.user.id
                    ? conn.toUserId
                    : conn.fromUserId;

                accepted.push({
                    userId: otherUserId.toString(),
                    username: userInfo.username,
                    email: userInfo.email,
                    headline: profile?.headline || '',
                    skills: profile?.skills || [],
                    links: profile?.links || [],
                    bio: profile?.bio || '',
                });
            } else if (
                conn.status === 'pending' &&
                conn.toUserId.toString() === req.user.id
            ) {
                // Incoming pending request
                incoming.push(conn);
            } else if (
                conn.status === 'pending' &&
                conn.fromUserId.toString() === req.user.id
            ) {
                // Outgoing pending request
                outgoing.push(conn);
            }
        }

        res.status(200).json({
            success: true,
            data: {
                accepted,
                incoming,
                outgoing,
            },
        });
    } catch (error: any) {
        console.error('Error listing connections:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to list connections',
            error: error.message,
        });
    }
};

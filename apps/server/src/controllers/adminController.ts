import { Request, Response } from 'express';
import { User } from '../models/User';
import { Room } from '../models/Room';
import { ModerationLog } from '../models/ModerationLog';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import type { UserRole, ModerationAction } from '@metaverse/shared';

// Store io instance for socket emissions
let io: Server;

export const setSocketIOForAdmin = (socketIO: Server) => {
    io = socketIO;
};

/**
 * Helper function to log moderation actions
 */
const logModerationAction = async (
    action: ModerationAction,
    issuedByUserId: string,
    targetUserId?: string,
    roomId?: string,
    reason?: string
) => {
    await ModerationLog.create({
        action,
        targetUserId: targetUserId
            ? new mongoose.Types.ObjectId(targetUserId)
            : undefined,
        issuedByUserId: new mongoose.Types.ObjectId(issuedByUserId),
        roomId,
        reason,
    });
};

/**
 * GET /api/admin/users
 * List all users (moderator+)
 */
export const getUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const users = await User.find()
            .select('_id username email role isMuted bannedRooms createdAt')
            .sort({ createdAt: -1 })
            .limit(100);

        res.status(200).json({
            success: true,
            data: users,
        });
    } catch (error: any) {
        console.error('Error getting users:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users',
            error: error.message,
        });
    }
};

/**
 * POST /api/admin/users/:userId/role
 * Change user role (admin only)
 */
export const changeUserRole = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId } = req.params;
        const { role } = req.body as { role: UserRole };

        if (!role || !['user', 'moderator', 'admin'].includes(role)) {
            res.status(400).json({
                success: false,
                message: 'Invalid role. Must be user, moderator, or admin',
            });
            return;
        }

        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found',
            });
            return;
        }

        const oldRole = user.role;
        user.role = role;
        await user.save();

        // Log the action
        await logModerationAction(
            'roleChange',
            (req as any).user.id,
            userId,
            undefined,
            `Changed from ${oldRole} to ${role}`
        );

        res.status(200).json({
            success: true,
            message: `User role updated to ${role}`,
            data: {
                userId: user._id,
                username: user.username,
                role: user.role,
            },
        });
    } catch (error: any) {
        console.error('Error changing user role:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to change user role',
            error: error.message,
        });
    }
};

/**
 * POST /api/admin/users/:userId/mute
 * Mute user (moderator+)
 */
export const muteUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId } = req.params;
        const { roomId, reason } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found',
            });
            return;
        }

        user.isMuted = true;
        await user.save();

        // Log the action
        await logModerationAction('mute', (req as any).user.id, userId, roomId, reason);

        // Emit socket event to notify user and room
        if (io && roomId) {
            io.to(roomId).emit('system:message', {
                message: `${user.username} has been muted`,
            });

            // Notify the user directly
            io.emit('user:muted', {
                userId,
                roomId,
            });
        }

        res.status(200).json({
            success: true,
            message: 'User muted successfully',
            data: {
                userId: user._id,
                username: user.username,
                isMuted: user.isMuted,
            },
        });
    } catch (error: any) {
        console.error('Error muting user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mute user',
            error: error.message,
        });
    }
};

/**
 * POST /api/admin/users/:userId/unmute
 * Unmute user (moderator+)
 */
export const unmuteUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId } = req.params;
        const { roomId } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found',
            });
            return;
        }

        user.isMuted = false;
        await user.save();

        // Log the action
        await logModerationAction('unmute', (req as any).user.id, userId, roomId);

        // Emit socket event
        if (io && roomId) {
            io.to(roomId).emit('system:message', {
                message: `${user.username} has been unmuted`,
            });

            io.emit('user:unmuted', {
                userId,
                roomId,
            });
        }

        res.status(200).json({
            success: true,
            message: 'User unmuted successfully',
            data: {
                userId: user._id,
                username: user.username,
                isMuted: user.isMuted,
            },
        });
    } catch (error: any) {
        console.error('Error unmuting user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to unmute user',
            error: error.message,
        });
    }
};

/**
 * POST /api/admin/users/:userId/kick
 * Kick user from room (moderator+)
 */
export const kickUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId } = req.params;
        const { roomId, reason } = req.body;

        if (!roomId) {
            res.status(400).json({
                success: false,
                message: 'roomId is required',
            });
            return;
        }

        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found',
            });
            return;
        }

        // Add room to banned rooms if not already there
        if (!user.bannedRooms?.includes(roomId)) {
            user.bannedRooms = [...(user.bannedRooms || []), roomId];
            await user.save();
        }

        // Log the action
        await logModerationAction('kick', (req as any).user.id, userId, roomId, reason);

        // Emit socket event to kick the user
        if (io) {
            io.emit('system:kicked', {
                userId,
                roomId,
                reason: reason || 'You have been removed from this room',
            });

            io.to(roomId).emit('system:message', {
                message: `${user.username} has been removed from the room`,
            });
        }

        res.status(200).json({
            success: true,
            message: 'User kicked successfully',
            data: {
                userId: user._id,
                username: user.username,
                roomId,
            },
        });
    } catch (error: any) {
        console.error('Error kicking user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to kick user',
            error: error.message,
        });
    }
};

/**
 * POST /api/admin/rooms/:roomId/lock
 * Lock room (moderator+)
 */
export const lockRoom = async (req: Request, res: Response): Promise<void> => {
    try {
        const { roomId } = req.params;

        const room = await Room.findById(roomId);
        if (!room) {
            res.status(404).json({
                success: false,
                message: 'Room not found',
            });
            return;
        }

        (room as any).locked = true;
        await room.save();

        // Log the action
        await logModerationAction('lockRoom', (req as any).user.id, undefined, roomId);

        // Emit socket event
        if (io) {
            io.to(roomId).emit('system:message', {
                message: 'This room has been locked. No new users can join.',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Room locked successfully',
            data: {
                roomId: room._id,
                name: room.name,
                locked: true,
            },
        });
    } catch (error: any) {
        console.error('Error locking room:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to lock room',
            error: error.message,
        });
    }
};

/**
 * POST /api/admin/rooms/:roomId/unlock
 * Unlock room (moderator+)
 */
export const unlockRoom = async (req: Request, res: Response): Promise<void> => {
    try {
        const { roomId } = req.params;

        const room = await Room.findById(roomId);
        if (!room) {
            res.status(404).json({
                success: false,
                message: 'Room not found',
            });
            return;
        }

        (room as any).locked = false;
        await room.save();

        // Log the action
        await logModerationAction('unlockRoom', (req as any).user.id, undefined, roomId);

        // Emit socket event
        if (io) {
            io.to(roomId).emit('system:message', {
                message: 'This room has been unlocked.',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Room unlocked successfully',
            data: {
                roomId: room._id,
                name: room.name,
                locked: false,
            },
        });
    } catch (error: any) {
        console.error('Error unlocking room:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to unlock room',
            error: error.message,
        });
    }
};

/**
 * GET /api/admin/moderation-logs
 * Get moderation logs (admin only)
 */
export const getModerationLogs = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { roomId, userId } = req.query;

        const query: any = {};
        if (roomId) query.roomId = roomId;
        if (userId) query.targetUserId = new mongoose.Types.ObjectId(userId as string);

        const logs = await ModerationLog.find(query)
            .populate('targetUserId', 'username email')
            .populate('issuedByUserId', 'username email')
            .sort({ createdAt: -1 })
            .limit(100);

        res.status(200).json({
            success: true,
            data: logs,
        });
    } catch (error: any) {
        console.error('Error getting moderation logs:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch moderation logs',
            error: error.message,
        });
    }
};

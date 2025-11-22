import { Server, Socket } from 'socket.io';
import { User } from '../models/User';
import { ModerationLog } from '../models/ModerationLog';
import mongoose from 'mongoose';

/**
 * Socket.io moderation event handlers
 * Handles real-time moderation actions from admins/moderators
 */
export const setupModerationHandlers = (io: Server) => {
    io.on('connection', (socket: Socket) => {
        /**
         * Admin: Mute user via Socket.io
         * Only allow moderators and admins
         */
        socket.on(
            'admin:mute',
            async (data: { targetUserId: string; roomId?: string; reason?: string }) => {
                try {
                    const socketData = socket.data as any;
                    const userRole = socketData.role;

                    // Check if user has permission
                    if (userRole !== 'moderator' && userRole !== 'admin') {
                        socket.emit('admin:error', {
                            message: 'Insufficient permissions',
                        });
                        return;
                    }

                    const { targetUserId, roomId, reason } = data;

                    // Update user
                    const user = await User.findById(targetUserId);
                    if (!user) {
                        socket.emit('admin:error', { message: 'User not found' });
                        return;
                    }

                    user.isMuted = true;
                    await user.save();

                    // Log action
                    await ModerationLog.create({
                        action: 'mute',
                        targetUserId: new mongoose.Types.ObjectId(targetUserId),
                        issuedByUserId: new mongoose.Types.ObjectId(socketData.userId),
                        roomId,
                        reason,
                    });

                    // Notify room
                    if (roomId) {
                        io.to(roomId).emit('system:message', {
                            message: `${user.username} has been muted`,
                        });
                    }

                    // Notify target user
                    io.emit('user:muted', { userId: targetUserId, roomId });

                    socket.emit('admin:success', {
                        message: 'User muted successfully',
                    });
                } catch (error) {
                    console.error('Error in admin:mute:', error);
                    socket.emit('admin:error', { message: 'Failed to mute user' });
                }
            }
        );

        /**
         * Admin: Unmute user via Socket.io
         */
        socket.on(
            'admin:unmute',
            async (data: { targetUserId: string; roomId?: string }) => {
                try {
                    const socketData = socket.data as any;
                    const userRole = socketData.role;

                    if (userRole !== 'moderator' && userRole !== 'admin') {
                        socket.emit('admin:error', {
                            message: 'Insufficient permissions',
                        });
                        return;
                    }

                    const { targetUserId, roomId } = data;

                    const user = await User.findById(targetUserId);
                    if (!user) {
                        socket.emit('admin:error', { message: 'User not found' });
                        return;
                    }

                    user.isMuted = false;
                    await user.save();

                    // Log action
                    await ModerationLog.create({
                        action: 'unmute',
                        targetUserId: new mongoose.Types.ObjectId(targetUserId),
                        issuedByUserId: new mongoose.Types.ObjectId(socketData.userId),
                        roomId,
                    });

                    // Notify room
                    if (roomId) {
                        io.to(roomId).emit('system:message', {
                            message: `${user.username} has been unmuted`,
                        });
                    }

                    io.emit('user:unmuted', { userId: targetUserId, roomId });

                    socket.emit('admin:success', {
                        message: 'User unmuted successfully',
                    });
                } catch (error) {
                    console.error('Error in admin:unmute:', error);
                    socket.emit('admin:error', { message: 'Failed to unmute user' });
                }
            }
        );

        /**
         * Admin: Kick user from room via Socket.io
         */
        socket.on(
            'admin:kick',
            async (data: { targetUserId: string; roomId: string; reason?: string }) => {
                try {
                    const socketData = socket.data as any;
                    const userRole = socketData.role;

                    if (userRole !== 'moderator' && userRole !== 'admin') {
                        socket.emit('admin:error', {
                            message: 'Insufficient permissions',
                        });
                        return;
                    }

                    const { targetUserId, roomId, reason } = data;

                    const user = await User.findById(targetUserId);
                    if (!user) {
                        socket.emit('admin:error', { message: 'User not found' });
                        return;
                    }

                    // Add to banned rooms
                    if (!user.bannedRooms?.includes(roomId)) {
                        user.bannedRooms = [...(user.bannedRooms || []), roomId];
                        await user.save();
                    }

                    // Log action
                    await ModerationLog.create({
                        action: 'kick',
                        targetUserId: new mongoose.Types.ObjectId(targetUserId),
                        issuedByUserId: new mongoose.Types.ObjectId(socketData.userId),
                        roomId,
                        reason,
                    });

                    // Emit kick event to target user
                    io.emit('system:kicked', {
                        userId: targetUserId,
                        roomId,
                        reason: reason || 'You have been removed from this room',
                    });

                    // Notify room
                    io.to(roomId).emit('system:message', {
                        message: `${user.username} has been removed from the room`,
                    });

                    socket.emit('admin:success', {
                        message: 'User kicked successfully',
                    });
                } catch (error) {
                    console.error('Error in admin:kick:', error);
                    socket.emit('admin:error', { message: 'Failed to kick user' });
                }
            }
        );
    });
};

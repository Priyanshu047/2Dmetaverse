import mongoose, { Schema, Document } from 'mongoose';

/**
 * Moderation action types
 */
export type ModerationAction =
    | 'mute'
    | 'unmute'
    | 'kick'
    | 'ban'
    | 'lockRoom'
    | 'unlockRoom'
    | 'roleChange';

/**
 * ModerationLog interface
 */
export interface IModerationLog extends Document {
    action: ModerationAction;
    targetUserId?: mongoose.Types.ObjectId;
    issuedByUserId: mongoose.Types.ObjectId;
    roomId?: mongoose.Types.ObjectId | string;
    reason?: string;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * ModerationLog schema
 * Tracks all moderation actions performed by admins/moderators
 */
const ModerationLogSchema = new Schema<IModerationLog>(
    {
        action: {
            type: String,
            enum: ['mute', 'unmute', 'kick', 'ban', 'lockRoom', 'unlockRoom', 'roleChange'],
            required: true,
        },
        targetUserId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: false,
        },
        issuedByUserId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        roomId: {
            type: String,
            required: false,
        },
        reason: {
            type: String,
            maxlength: 500,
        },
    },
    {
        timestamps: true,
    }
);

// Index for efficient queries
ModerationLogSchema.index({ createdAt: -1 });
ModerationLogSchema.index({ targetUserId: 1 });
ModerationLogSchema.index({ roomId: 1 });
ModerationLogSchema.index({ issuedByUserId: 1 });

export const ModerationLog = mongoose.model<IModerationLog>(
    'ModerationLog',
    ModerationLogSchema
);

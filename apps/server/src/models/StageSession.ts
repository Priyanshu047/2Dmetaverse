import mongoose, { Schema, Document } from 'mongoose';

/**
 * StageSession interface - tracks active stage presentations
 */
export interface IStageSession extends Document {
    roomId: mongoose.Types.ObjectId;
    presenterId: mongoose.Types.ObjectId | null;
    isLive: boolean;
    startedAt?: Date;
    endedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * StageSession schema
 * Tracks the current state of a stage room presentation
 */
const StageSessionSchema = new Schema<IStageSession>(
    {
        roomId: {
            type: Schema.Types.ObjectId,
            ref: 'Room',
            required: true,
            index: true,
        },
        presenterId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        isLive: {
            type: Boolean,
            default: false,
        },
        startedAt: {
            type: Date,
            default: null,
        },
        endedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for efficient queries
StageSessionSchema.index({ roomId: 1, isLive: 1 });

// Only allow one active session per room
StageSessionSchema.index(
    { roomId: 1, isLive: 1 },
    {
        unique: true,
        partialFilterExpression: { isLive: true },
    }
);

export const StageSession = mongoose.model<IStageSession>(
    'StageSession',
    StageSessionSchema
);

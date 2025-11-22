import mongoose, { Document, Schema } from 'mongoose';

/**
 * Connection status type
 */
export type ConnectionStatus = 'pending' | 'accepted' | 'rejected';

/**
 * Connection document interface extending Mongoose Document
 */
export interface IConnection extends Document {
    fromUserId: mongoose.Types.ObjectId;
    toUserId: mongoose.Types.ObjectId;
    status: ConnectionStatus;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Connection schema definition
 */
const connectionSchema = new Schema<IConnection>(
    {
        fromUserId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Sender user ID is required'],
            index: true,
        },
        toUserId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Receiver user ID is required'],
            index: true,
        },
        status: {
            type: String,
            enum: {
                values: ['pending', 'accepted', 'rejected'],
                message: 'Status must be pending, accepted, or rejected',
            },
            default: 'pending',
        },
    },
    {
        timestamps: true, // Automatically adds createdAt and updatedAt
    }
);

/**
 * Compound index to prevent duplicate connections
 * Ensures that a user can only have one connection request with another user
 */
connectionSchema.index(
    { fromUserId: 1, toUserId: 1 },
    { unique: true }
);

/**
 * Index for faster lookups of user connections
 */
connectionSchema.index({ fromUserId: 1, status: 1 });
connectionSchema.index({ toUserId: 1, status: 1 });

/**
 * Validation to prevent self-connections
 */
connectionSchema.pre('save', function (next) {
    if (this.fromUserId.equals(this.toUserId)) {
        const error = new Error('Users cannot connect with themselves');
        return next(error);
    }
    next();
});

/**
 * Transform toJSON to clean up response
 */
connectionSchema.set('toJSON', {
    transform: function (_doc, ret: any) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});

// Create and export the Connection model
export const Connection = mongoose.model<IConnection>(
    'Connection',
    connectionSchema
);

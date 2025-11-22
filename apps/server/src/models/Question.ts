import mongoose, { Schema, Document } from 'mongoose';

/**
 * Question status type
 */
export type QuestionStatus = 'pending' | 'answered' | 'dismissed';

/**
 * Question interface - represents a Q&A question in a stage session
 */
export interface IQuestion extends Document {
    stageSessionId: mongoose.Types.ObjectId;
    roomId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    username: string;
    questionText: string;
    status: QuestionStatus;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Question schema
 * Stores Q&A questions submitted by audience members
 */
const QuestionSchema = new Schema<IQuestion>(
    {
        stageSessionId: {
            type: Schema.Types.ObjectId,
            ref: 'StageSession',
            required: true,
            index: true,
        },
        roomId: {
            type: Schema.Types.ObjectId,
            ref: 'Room',
            required: true,
            index: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        username: {
            type: String,
            required: true,
        },
        questionText: {
            type: String,
            required: true,
            maxlength: 500,
        },
        status: {
            type: String,
            enum: ['pending', 'answered', 'dismissed'],
            default: 'pending',
        },
    },
    {
        timestamps: true,
    }
);

// Index for efficient queries by session
QuestionSchema.index({ stageSessionId: 1, createdAt: -1 });
QuestionSchema.index({ roomId: 1, createdAt: -1 });

export const Question = mongoose.model<IQuestion>('Question', QuestionSchema);

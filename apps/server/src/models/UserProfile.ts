import mongoose, { Document, Schema } from 'mongoose';

/**
 * Link item interface for social/professional links
 */
export interface ILinkItem {
    label: string;
    url: string;
}

/**
 * UserProfile document interface extending Mongoose Document
 */
export interface IUserProfile extends Document {
    userId: mongoose.Types.ObjectId;
    headline: string;
    skills: string[];
    links: ILinkItem[];
    bio?: string;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * UserProfile schema definition
 */
const userProfileSchema = new Schema<IUserProfile>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
            unique: true,
            index: true,
        },
        headline: {
            type: String,
            default: '',
            trim: true,
            maxlength: [200, 'Headline cannot exceed 200 characters'],
        },
        skills: {
            type: [String],
            default: [],
            validate: {
                validator: function (skills: string[]) {
                    return skills.length <= 50;
                },
                message: 'Cannot have more than 50 skills',
            },
        },
        links: {
            type: [
                {
                    label: {
                        type: String,
                        required: true,
                        trim: true,
                        maxlength: [50, 'Link label cannot exceed 50 characters'],
                    },
                    url: {
                        type: String,
                        required: true,
                        trim: true,
                        match: [
                            /^https?:\/\/.+/,
                            'URL must be a valid http or https URL',
                        ],
                    },
                },
            ],
            default: [],
            validate: {
                validator: function (links: ILinkItem[]) {
                    return links.length <= 10;
                },
                message: 'Cannot have more than 10 links',
            },
        },
        bio: {
            type: String,
            default: '',
            trim: true,
            maxlength: [1000, 'Bio cannot exceed 1000 characters'],
        },
    },
    {
        timestamps: true, // Automatically adds createdAt and updatedAt
    }
);

/**
 * Index for faster lookups by userId
 */
userProfileSchema.index({ userId: 1 });

/**
 * Transform toJSON to clean up response
 */
userProfileSchema.set('toJSON', {
    transform: function (_doc, ret: any) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});

// Create and export the UserProfile model
export const UserProfile = mongoose.model<IUserProfile>(
    'UserProfile',
    userProfileSchema
);

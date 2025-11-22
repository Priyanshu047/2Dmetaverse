import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

/**
 * User document interface extending Mongoose Document
 */
export interface IUser extends Document {
    username: string;
    email: string;
    passwordHash: string;
    role: 'user' | 'moderator' | 'admin';
    avatarId?: string;
    isMuted?: boolean;
    bannedRooms?: string[];
    createdAt: Date;

    // Instance methods
    comparePassword(candidatePassword: string): Promise<boolean>;
}

/**
 * User schema definition
 */
const userSchema = new Schema<IUser>(
    {
        username: {
            type: String,
            required: [true, 'Username is required'],
            unique: true,
            trim: true,
            minlength: [3, 'Username must be at least 3 characters'],
            maxlength: [30, 'Username cannot exceed 30 characters'],
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [
                /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                'Please provide a valid email address',
            ],
        },
        passwordHash: {
            type: String,
            required: [true, 'Password is required'],
        },
        role: {
            type: String,
            enum: ['user', 'moderator', 'admin'],
            default: 'user',
        },
        avatarId: {
            type: String,
            default: null,
        },
        isMuted: {
            type: Boolean,
            default: false,
        },
        bannedRooms: {
            type: [String],
            default: [],
        },
    },
    {
        timestamps: true, // Automatically adds createdAt and updatedAt
    }
);

/**
 * Pre-save middleware to hash password before saving
 */
userSchema.pre('save', async function (next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('passwordHash')) {
        return next();
    }

    try {
        // Generate salt and hash password
        const salt = await bcrypt.genSalt(10);
        this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
        next();
    } catch (error: any) {
        next(error);
    }
});

/**
 * Instance method to compare password with hash
 */
userSchema.methods.comparePassword = async function (
    candidatePassword: string
): Promise<boolean> {
    try {
        return await bcrypt.compare(candidatePassword, this.passwordHash);
    } catch (error) {
        return false;
    }
};

/**
 * Transform toJSON to remove sensitive data
 */
userSchema.set('toJSON', {
    transform: function (_doc, ret: any) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash; // Never send password hash to client
        return ret;
    },
});

// Create and export the User model
export const User = mongoose.model<IUser>('User', userSchema);

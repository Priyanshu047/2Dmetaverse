import { Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { config } from '../config/env';
import { AuthenticatedRequest } from '../types';
import { AppError } from '../middleware/errorMiddleware';

/**
 * Generate JWT token for user
 */
const generateToken = (user: any): string => {
    return jwt.sign(
        {
            id: user._id,
            email: user.email,
            username: user.username,
            role: user.role,
        },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
    );
};

/**
 * Register a new user
 * POST /auth/register
 */
export const register = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    const { username, email, password, role } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
        throw new AppError('Username, email, and password are required', 400);
    }

    // Validate password length
    if (password.length < 6) {
        throw new AppError('Password must be at least 6 characters long', 400);
    }

    // Check if user already exists
    const existingUser = await User.findOne({
        $or: [{ email }, { username }],
    });

    if (existingUser) {
        if (existingUser.email === email) {
            throw new AppError('Email already registered', 400);
        }
        if (existingUser.username === username) {
            throw new AppError('Username already taken', 400);
        }
    }

    // Create new user (password will be hashed by pre-save hook)
    const user = await User.create({
        username,
        email,
        passwordHash: password, // Will be hashed by mongoose middleware
        role: role || 'user', // Default to 'user' if not specified
    });

    // Generate JWT token
    const token = generateToken(user);

    // Send response
    res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
            },
            token,
        },
    });
};

/**
 * Login user
 * POST /auth/login
 */
export const login = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
        throw new AppError('Email and password are required', 400);
    }

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
        throw new AppError('Invalid email or password', 401);
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
        throw new AppError('Invalid email or password', 401);
    }

    // Generate JWT token
    const token = generateToken(user);

    // Send response
    res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                avatarId: user.avatarId,
            },
            token,
        },
    });
};

/**
 * Get current authenticated user
 * GET /auth/me
 */
export const getCurrentUser = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    if (!req.user) {
        throw new AppError('Not authenticated', 401);
    }

    // Find full user data
    const user = await User.findById(req.user.id).select('-passwordHash');

    if (!user) {
        throw new AppError('User not found', 404);
    }

    res.status(200).json({
        success: true,
        data: {
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                avatarId: user.avatarId,
                createdAt: user.createdAt,
            },
        },
    });
};

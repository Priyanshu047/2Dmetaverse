import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { AuthenticatedRequest } from '../types';

/**
 * JWT payload interface
 */
interface JWTPayload {
    id: string;
    email: string;
    username: string;
    role: 'user' | 'admin';
}

/**
 * Authentication middleware
 * Verifies JWT token and attaches user data to request
 */
export const authenticate = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                message: 'No token provided. Authorization header must be in format: Bearer <token>',
            });
            return;
        }

        // Extract token
        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        try {
            // Verify token
            const decoded = jwt.verify(token, config.jwtSecret) as JWTPayload;

            // Attach user data to request
            req.user = {
                id: decoded.id,
                email: decoded.email,
                username: decoded.username,
                role: decoded.role,
            };

            next();
        } catch (error: any) {
            if (error.name === 'TokenExpiredError') {
                res.status(401).json({
                    success: false,
                    message: 'Token has expired',
                });
                return;
            }

            res.status(401).json({
                success: false,
                message: 'Invalid token',
            });
            return;
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Authentication error',
        });
    }
};

/**
 * Admin-only middleware
 * Must be used after authenticate middleware
 */
export const requireAdmin = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): void => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            message: 'Authentication required',
        });
        return;
    }

    if (req.user.role !== 'admin') {
        res.status(403).json({
            success: false,
            message: 'Admin access required',
        });
        return;
    }

    next();
};

/**
 * Optional authentication middleware
 * Attaches user data if token is valid, but doesn't require it
 */
export const optionalAuth = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);

            try {
                const decoded = jwt.verify(token, config.jwtSecret) as JWTPayload;
                req.user = {
                    id: decoded.id,
                    email: decoded.email,
                    username: decoded.username,
                    role: decoded.role,
                };
            } catch (error) {
                // Token is invalid, but we don't fail the request
                // Just continue without user data
            }
        }

        next();
    } catch (error) {
        next();
    }
};

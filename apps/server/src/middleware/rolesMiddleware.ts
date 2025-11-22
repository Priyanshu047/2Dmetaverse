import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';

/**
 * User role types
 */
export type UserRole = 'user' | 'moderator' | 'admin';

/**
 * Role-based access control middleware
 * Checks if authenticated user has one of the required roles
 * 
 * @param allowedRoles - Array of roles that are allowed to access the route
 * @returns Express middleware function
 * 
 * @example
 * router.get('/admin/users', requireRole('admin'), getUsers);
 * router.post('/moderate', requireRole('admin', 'moderator'), moderateUser);
 */
export const requireRole = (...allowedRoles: UserRole[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
        // Check if user is authenticated
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required',
            });
            return;
        }

        // Check if user has required role
        const userRole = req.user.role as UserRole;

        if (!allowedRoles.includes(userRole)) {
            res.status(403).json({
                success: false,
                message: 'Access forbidden. Insufficient permissions.',
                required: allowedRoles,
                current: userRole,
            });
            return;
        }

        // User has required role, proceed
        next();
    };
};

/**
 * Helper to check if user is admin
 */
export const requireAdmin = requireRole('admin');

/**
 * Helper to check if user is moderator or admin
 */
export const requireModerator = requireRole('moderator', 'admin');

import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Environment configuration object
 * Validates and exports all required environment variables
 */
export const config = {
    // Server configuration
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',

    // Database configuration
    mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/metaverse',

    // JWT configuration
    jwtSecret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    jwtExpiresIn: '7d', // Token expiration time

    // CORS configuration
    clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

    // LiveKit configuration (for Virtual Stage)
    livekit: {
        apiKey: process.env.LIVEKIT_API_KEY || '',
        apiSecret: process.env.LIVEKIT_API_SECRET || '',
        url: process.env.LIVEKIT_URL || '',
    },

    // Google Gemini configuration (for AI NPCs)
    gemini: {
        apiKey: process.env.GEMINI_API_KEY || '',
        model: process.env.GEMINI_MODEL || 'gemini-pro',
    },
} as const;

/**
 * Validates that all required environment variables are set
 * Throws an error if any required variable is missing
 */
export const validateEnv = (): void => {
    const required = ['MONGODB_URI', 'JWT_SECRET'];
    const missing = required.filter((key) => !process.env[key]);

    if (missing.length > 0) {
        console.warn(
            `⚠️  Warning: Missing environment variables: ${missing.join(', ')}\n` +
            `   Using default values, but these should be set in production.`
        );
    }
};

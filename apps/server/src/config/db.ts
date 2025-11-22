import mongoose from 'mongoose';
import { config } from './env';

/**
 * Connect to MongoDB database
 * Handles connection errors and retry logic
 */
export const connectDatabase = async (): Promise<void> => {
    try {
        // Mongoose connection options
        const options = {
            // Use new URL parser
            // These options are now default in Mongoose 6+
        };

        // Connect to MongoDB
        await mongoose.connect(config.mongodbUri, options);

        console.log('✅ MongoDB connected successfully');
        console.log(`   Database: ${mongoose.connection.name}`);

        // Handle connection events
        mongoose.connection.on('error', (error) => {
            console.error('❌ MongoDB connection error:', error);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️  MongoDB disconnected');
        });

        // Graceful shutdown
        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            console.log('MongoDB connection closed through app termination');
            process.exit(0);
        });

    } catch (error) {
        console.error('❌ Failed to connect to MongoDB:', error);
        console.log('Retrying in 5 seconds...');

        // Retry connection after 5 seconds
        setTimeout(connectDatabase, 5000);
    }
};

/**
 * Close database connection
 */
export const closeDatabase = async (): Promise<void> => {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
};

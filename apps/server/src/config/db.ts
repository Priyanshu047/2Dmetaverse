import mongoose from 'mongoose';
import { config } from './env';

/**
 * Connect to MongoDB database
 * Handles connection errors and retry logic
 */
export const connectDatabase = async (): Promise<void> => {
    const MAX_RETRIES = 10;
    let retries = 0;

    while (retries < MAX_RETRIES) {
        try {
            // Mongoose connection options
            const options = {
                serverSelectionTimeoutMS: 5000
            };

            // Connect to MongoDB
            console.log('Current Working Directory:', process.cwd());
            console.log('URI Length:', config.mongodbUri.length);
            console.log('URI Value:', JSON.stringify(config.mongodbUri));
            console.log('Attempting to connect with URI:', config.mongodbUri.replace(/:([^:@]+)@/, ':****@'));
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

            return; // Connection successful, exit function

        } catch (error: any) {
            retries++;
            console.error(`❌ Failed to connect to MongoDB (Attempt ${retries}/${MAX_RETRIES}):`);
            console.error('Error Name:', error.name);
            console.error('Error Message:', error.message);
            if (error.reason) console.error('Error Reason:', error.reason);
            if (error.code) console.error('Error Code:', error.code);

            if (retries >= MAX_RETRIES) {
                console.error('❌ Max retries reached. Exiting...');
                process.exit(1);
            }

            console.log('Retrying in 5 seconds...');
            // Wait for 5 seconds before retrying
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
};

/**
 * Close database connection
 */
export const closeDatabase = async (): Promise<void> => {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
};

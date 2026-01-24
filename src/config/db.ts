import mongoose from 'mongoose';
import { env } from './env.js';

export const connectMongo = async (): Promise<void> => {
    try {
        await mongoose.connect(env.mongoUri);
        console.log('MongoDB connected');
    } catch (err) {
        console.error('MongoDB connection error', err);
        throw err;
    }
};

export const getDbState = (): string => {
    const state = mongoose.connection.readyState;
    if (state === 1) return 'connected';
    if (state === 2) return 'connecting';
    if (state === 3) return 'disconnecting';
    return 'disconnected';
};

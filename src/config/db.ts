import mongoose from 'mongoose';

export const connectMongo = async (): Promise<void> => {
    const mongoUri = process.env.MONGO_URI ?? 'mongodb://127.0.0.1:27017/realestate';
    try {
        const sanitized = mongoUri.replace(/:\/\/([^@]+)@/, '://<credentials>@');
        console.log(`Connecting to MongoDB: ${sanitized}`);
        await mongoose.connect(mongoUri);
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

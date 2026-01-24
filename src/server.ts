import app from './app.js';
import { connectMongo } from './config/db.js';
import { env } from './config/env.js';

const start = async () => {
    await connectMongo();
    app.listen(env.port, () => {
        console.log(`Server running on port ${env.port}`);
    });
};

start().catch((err) => {
    console.error('Failed to start server', err);
    process.exit(1);
});

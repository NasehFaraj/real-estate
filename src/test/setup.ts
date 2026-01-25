import { afterAll, beforeAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, openSync, closeSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

beforeAll(async () => {
    console.log('[test-setup] start');
    process.env.NODE_ENV = 'test';
    process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? 'test-access-secret';
    process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? 'test-refresh-secret';
    process.env.ACCESS_COOKIE_NAME = process.env.ACCESS_COOKIE_NAME ?? 'access_token';
    process.env.REFRESH_COOKIE_NAME = process.env.REFRESH_COOKIE_NAME ?? 'refresh_token';
    process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/realestate_test';
    const cacheDir = join(process.cwd(), '.cache');
    const lockFile = join(cacheDir, 'test-mongo.lock');
    const readyFile = join(cacheDir, 'test-mongo.ready');
    mkdirSync(cacheDir, { recursive: true });

    if (!existsSync(readyFile)) {
        let lockFd: number | null = null;
        try {
            lockFd = openSync(lockFile, 'wx');
            console.log('[test-setup] starting mongo via docker compose');
            execSync('docker compose up -d --no-recreate mongo', { stdio: 'inherit' });
            writeFileSync(readyFile, 'ready');
        } catch {
            console.log('[test-setup] waiting for mongo lock');
        } finally {
            if (lockFd !== null) closeSync(lockFd);
        }
    }

    console.log('[test-setup] waiting for mongo');
    const uri = process.env.MONGO_URI;
    let connected = false;
    let lastError: unknown;
    for (let attempt = 1; attempt <= 30; attempt += 1) {
        try {
            await mongoose.connect(uri, {
                serverSelectionTimeoutMS: 3000,
                connectTimeoutMS: 3000,
            });
            connected = true;
            break;
        } catch (err) {
            lastError = err;
            console.log(`[test-setup] connect retry ${attempt}/30`);
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
    }

    if (!connected) {
        console.error('[test-setup] mongoose.connect failed', lastError);
        throw lastError;
    }

    console.log('[test-setup] connected to mongo');
    await import('../app.js');
    console.log('[test-setup] after app import');
}, 120000);

beforeEach(async () => {
    const collections = await mongoose.connection.db?.collections();
    if (!collections) return;
    await Promise.all(collections.map((collection) => collection.deleteMany({})));
});

afterAll(async () => {
    try {
        const db = mongoose.connection.db;
        if (db) await db.dropDatabase();
    } catch (err) {
        console.error('[test-setup] dropDatabase failed', err);
    }
    await mongoose.disconnect();
    if (process.env.TEST_STOP_DOCKER === 'true') {
        try {
            execSync('docker compose stop mongo', { stdio: 'inherit' });
        } catch (err) {
            console.error('[test-setup] docker compose stop failed', err);
        }
    }
});

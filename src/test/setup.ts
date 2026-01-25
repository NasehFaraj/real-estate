import { afterAll, beforeAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { execSync } from 'node:child_process';
import { accessSync, constants } from 'node:fs';

beforeAll(async () => {
    console.log('[test-setup] start');
    process.env.NODE_ENV = 'test';
    process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? 'test-access-secret';
    process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? 'test-refresh-secret';
    process.env.ACCESS_COOKIE_NAME = process.env.ACCESS_COOKIE_NAME ?? 'access_token';
    process.env.REFRESH_COOKIE_NAME = process.env.REFRESH_COOKIE_NAME ?? 'refresh_token';
    try {
        accessSync('/var/run/docker.sock', constants.R_OK | constants.W_OK);
        execSync('docker ps', { stdio: 'ignore' });
    } catch (err) {
        console.error('[test-setup] docker daemon unavailable', err);
        throw err;
    }
    console.log('[test-setup] starting mongo via docker compose');
    execSync('docker compose up -d --no-recreate mongo', { stdio: 'inherit' });

    console.log('[test-setup] waiting for mongo');
    const maxAttempts = 60;
    const readContainerEnv = (key: string): string => {
        try {
            return execSync(`docker compose exec -T mongo printenv ${key}`, {
                stdio: 'pipe',
            })
                .toString()
                .trim();
        } catch {
            return '';
        }
    };
    const mongoUser = readContainerEnv('MONGO_INITDB_ROOT_USERNAME');
    const mongoPass = readContainerEnv('MONGO_INITDB_ROOT_PASSWORD');
    const hasAuth = Boolean(mongoUser && mongoPass);
    const pingUri = hasAuth
        ? `mongodb://${mongoUser}:${mongoPass}@127.0.0.1:27017/admin?authSource=admin`
        : 'mongodb://127.0.0.1:27017/admin';
    const uri = hasAuth
        ? `mongodb://${mongoUser}:${mongoPass}@127.0.0.1:27017/realestate_test?authSource=admin`
        : 'mongodb://127.0.0.1:27017/realestate_test';
    process.env.MONGO_URI = uri;
    let lastError: unknown;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
            execSync(
                `docker compose exec -T mongo mongosh --quiet "${pingUri}" --eval "db.runCommand({ ping: 1 })"`,
                { stdio: 'ignore' }
            );
            break;
        } catch (err) {
            lastError = err;
            console.log(`[test-setup] ping retry ${attempt}/${maxAttempts}`);
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
    }

    if (lastError) {
        console.log('[test-setup] attempting mongoose connect');
    }

    let connected = false;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
            await mongoose.connect(uri, {
                serverSelectionTimeoutMS: 3000,
                connectTimeoutMS: 3000,
            });
            connected = true;
            break;
        } catch (err) {
            lastError = err;
            console.log(`[test-setup] connect retry ${attempt}/${maxAttempts}`);
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

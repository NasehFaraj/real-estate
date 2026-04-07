import { defineConfig } from 'vitest/config';

process.env.NODE_ENV ??= 'test';
process.env.JWT_ACCESS_SECRET ??= 'test-access-secret';
process.env.JWT_REFRESH_SECRET ??= 'test-refresh-secret';
process.env.ACCESS_COOKIE_NAME ??= 'access_token';
process.env.REFRESH_COOKIE_NAME ??= 'refresh_token';

export default defineConfig({
    test: {
        environment: 'node',
        setupFiles: ['src/test/setup.ts'],
        include: ['src/test/**/*.test.ts'],
        hookTimeout: 120000,
        testTimeout: 120000,
        pool: 'forks',
        poolOptions: {
            forks: {
                singleFork: true,
            },
        },
    },
});

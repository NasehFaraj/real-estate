import { defineConfig } from 'vitest/config';

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

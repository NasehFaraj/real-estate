import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { app, createUser, loginAgent } from './helpers.js';

describe('Auth', () => {
    it('login success sets cookies', async () => {
        await createUser({
            name: 'Admin',
            email: 'admin@test.com',
            password: 'Pass1234',
            role: 'admin',
        });

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'admin@test.com', password: 'Pass1234' });

        expect(res.status).toBe(200);
        expect(res.headers['set-cookie']).toBeTruthy();
    });

    it('login invalid returns 400', async () => {
        const res = await request(app).post('/api/auth/login').send({ email: 'x', password: '' });
        expect(res.status).toBe(400);
    });

    it('refresh endpoint works', async () => {
        await createUser({
            name: 'Admin',
            email: 'admin2@test.com',
            password: 'Pass1234',
            role: 'admin',
        });
        const agent = await loginAgent('admin2@test.com', 'Pass1234');
        const res = await agent.post('/api/auth/refresh');
        expect(res.status).toBe(200);
    });
});

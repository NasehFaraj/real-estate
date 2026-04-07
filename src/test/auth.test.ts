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

    it('me returns current user for authenticated session', async () => {
        await createUser({
            name: 'Manager',
            email: 'manager@test.com',
            password: 'Pass1234',
            role: 'manager',
        });
        const agent = await loginAgent('manager@test.com', 'Pass1234');

        const res = await agent.get('/api/auth/me');
        expect(res.status).toBe(200);
        expect(res.body.data.email).toBe('manager@test.com');
        expect(res.body.data.role).toBe('manager');
        expect(res.body.data.password).toBeUndefined();
    });

    it('logout clears session access for protected endpoints', async () => {
        await createUser({
            name: 'Broker',
            email: 'broker@test.com',
            password: 'Pass1234',
            role: 'broker',
        });
        const agent = await loginAgent('broker@test.com', 'Pass1234');

        const logoutRes = await agent.post('/api/auth/logout');
        expect(logoutRes.status).toBe(200);

        const meRes = await agent.get('/api/auth/me');
        expect(meRes.status).toBe(401);
    });
});

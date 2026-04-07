import { describe, expect, it } from 'vitest';
import { createUser, loginAgent } from './helpers.js';

describe('Users RBAC', () => {
    it('admin can create manager and broker', async () => {
        await createUser({
            name: 'Admin',
            email: 'admin@test.com',
            password: 'Pass1234',
            role: 'admin',
        });
        const adminAgent = await loginAgent('admin@test.com', 'Pass1234');

        const res1 = await adminAgent.post('/api/users').send({
            name: 'Manager',
            phone: '111',
            email: 'manager@test.com',
            password: 'Pass1234',
            role: 'manager',
        });
        expect(res1.status).toBe(201);

        const res2 = await adminAgent.post('/api/users').send({
            name: 'Broker',
            phone: '222',
            email: 'broker@test.com',
            password: 'Pass1234',
            role: 'broker',
        });
        expect(res2.status).toBe(201);
    });

    it('manager cannot create users', async () => {
        await createUser({
            name: 'Manager',
            email: 'manager@test.com',
            password: 'Pass1234',
            role: 'manager',
        });
        const managerAgent = await loginAgent('manager@test.com', 'Pass1234');
        const res = await managerAgent.post('/api/users').send({
            name: 'Broker',
            phone: '222',
            email: 'broker@test.com',
            password: 'Pass1234',
            role: 'broker',
        });
        expect(res.status).toBe(403);
    });

    it('broker cannot list users', async () => {
        await createUser({
            name: 'Broker',
            email: 'broker@test.com',
            password: 'Pass1234',
            role: 'broker',
        });
        const agent = await loginAgent('broker@test.com', 'Pass1234');
        const res = await agent.get('/api/users');
        expect(res.status).toBe(403);
    });

    it('admin can list users', async () => {
        await createUser({
            name: 'Admin',
            email: 'admin@test.com',
            password: 'Pass1234',
            role: 'admin',
        });
        const agent = await loginAgent('admin@test.com', 'Pass1234');
        const res = await agent.get('/api/users');
        expect(res.status).toBe(200);
    });
});

import { describe, expect, it } from 'vitest';
import { createRequest, createUser, loginAgent } from './helpers.js';

const requestBody = {
    propertyType: 'apartment',
    usage: 'residential',
    status: 'open',
    priority: 'high',
    city: 'Hama',
    district: 'Center',
    minArea: 70,
    maxArea: 120,
    budget: 90000,
};

describe('Requests', () => {
    it('broker creates request with brokerName/brokerId auto-set', async () => {
        const broker = await createUser({
            name: 'Broker One',
            email: 'broker1@test.com',
            password: 'Pass1234',
            role: 'broker',
        });
        const brokerAgent = await loginAgent('broker1@test.com', 'Pass1234');
        const res = await createRequest(brokerAgent, {
            ...requestBody,
            brokerName: 'Injected',
        });
        expect(res.status).toBe(201);
        expect(res.body.data.brokerName).toBe('Broker One');
        expect(res.body.data.brokerId).toBe(broker!._id.toString());
    });

    it('broker sees only own requests in /me', async () => {
        await createUser({
            name: 'Broker One',
            email: 'broker1@test.com',
            password: 'Pass1234',
            role: 'broker',
        });
        await createUser({
            name: 'Broker Two',
            email: 'broker2@test.com',
            password: 'Pass1234',
            role: 'broker',
        });
        const broker1 = await loginAgent('broker1@test.com', 'Pass1234');
        const broker2 = await loginAgent('broker2@test.com', 'Pass1234');

        await createRequest(broker1, requestBody);
        await createRequest(broker2, { ...requestBody, city: 'Damascus' });

        const res = await broker1.get('/api/requests/me');
        expect(res.status).toBe(200);
        expect(res.body.data.items.length).toBe(1);
        expect(res.body.data.items[0].city).toBe('Hama');
    });

    it('manager can list all requests, broker cannot delete, manager can delete', async () => {
        await createUser({
            name: 'Manager',
            email: 'manager@test.com',
            password: 'Pass1234',
            role: 'manager',
        });
        await createUser({
            name: 'Broker',
            email: 'broker@test.com',
            password: 'Pass1234',
            role: 'broker',
        });

        const manager = await loginAgent('manager@test.com', 'Pass1234');
        const broker = await loginAgent('broker@test.com', 'Pass1234');

        const created = await createRequest(broker, requestBody);
        const requestId = created.body.data._id;

        const listRes = await manager.get('/api/requests');
        expect(listRes.status).toBe(200);
        expect(listRes.body.data.items.length).toBe(1);

        const brokerDel = await broker.delete(`/api/requests/${requestId}`);
        expect(brokerDel.status).toBe(403);

        const managerDel = await manager.delete(`/api/requests/${requestId}`);
        expect(managerDel.status).toBe(200);
    });

    it('broker can read own request and cannot read others', async () => {
        await createUser({
            name: 'Broker One',
            email: 'broker1@test.com',
            password: 'Pass1234',
            role: 'broker',
        });
        await createUser({
            name: 'Broker Two',
            email: 'broker2@test.com',
            password: 'Pass1234',
            role: 'broker',
        });
        const broker1 = await loginAgent('broker1@test.com', 'Pass1234');
        const broker2 = await loginAgent('broker2@test.com', 'Pass1234');

        const req1 = await createRequest(broker1, requestBody);
        const req2 = await createRequest(broker2, { ...requestBody, city: 'Damascus' });

        const okRes = await broker1.get(`/api/requests/${req1.body.data._id}`);
        expect(okRes.status).toBe(200);

        const forbidRes = await broker1.get(`/api/requests/${req2.body.data._id}`);
        expect(forbidRes.status).toBe(403);
    });
});

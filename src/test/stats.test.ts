import { describe, expect, it } from 'vitest';
import { createRequest, createUser, loginAgent } from './helpers.js';

describe('Stats', () => {
    it('counts offers/requests/matches', async () => {
        await createUser({
            name: 'Manager',
            email: 'manager@test.com',
            password: 'Pass1234',
            role: 'manager',
        });
        const manager = await loginAgent('manager@test.com', 'Pass1234');
        const res = await manager.get('/api/stats');
        expect(res.status).toBe(200);
        expect(res.body.data).toHaveProperty('offers');
        expect(res.body.data).toHaveProperty('requests');
        expect(res.body.data).toHaveProperty('matches');
    });

    it('most/least requested areas and filters', async () => {
        await createUser({
            name: 'Manager',
            email: 'manager@test.com',
            password: 'Pass1234',
            role: 'manager',
        });
        const manager = await loginAgent('manager@test.com', 'Pass1234');

        await createRequest(manager, {
            propertyType: 'house',
            usage: 'residential',
            status: 'open',
            priority: 'high',
            city: 'Hama',
            district: 'Center',
            minArea: 60,
            maxArea: 100,
            budget: 90000,
        });
        await createRequest(manager, {
            propertyType: 'house',
            usage: 'residential',
            status: 'open',
            priority: 'high',
            city: 'Hama',
            district: 'Center',
            minArea: 70,
            maxArea: 110,
            budget: 95000,
        });
        await createRequest(manager, {
            propertyType: 'apartment',
            usage: 'commercial',
            status: 'open',
            priority: 'low',
            city: 'Damascus',
            district: 'Midan',
            minArea: 80,
            maxArea: 120,
            budget: 120000,
        });

        const most = await manager.get('/api/stats/most-requested-areas');
        expect(most.status).toBe(200);
        expect(most.body.data.items[0].city).toBe('Hama');

        const least = await manager.get('/api/stats/least-requested-areas');
        expect(least.status).toBe(200);
        expect(least.body.data.items[0].city).toBe('Damascus');

        const filtered = await manager.get('/api/stats/most-requested-areas?city=Hama');
        expect(filtered.status).toBe(200);
        expect(filtered.body.data.items.length).toBe(1);
        expect(filtered.body.data.items[0].city).toBe('Hama');
    });

    it('broker cannot access stats', async () => {
        await createUser({
            name: 'Broker',
            email: 'broker@test.com',
            password: 'Pass1234',
            role: 'broker',
        });
        const broker = await loginAgent('broker@test.com', 'Pass1234');
        const res = await broker.get('/api/stats');
        expect(res.status).toBe(403);
    });
});
